import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, createHash } from "node:crypto";

const COS_BUCKET = "intereco-basic-1305364972";
const COS_REGION = "ap-nanjing";

function getCosPresignedUrl(key: string, secretId: string, secretKey: string, method = "put"): string {
  const host = `${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;
  const now = Math.floor(Date.now() / 1000);
  const expire = now + 600;
  const signTime = `${now};${expire}`;
  const signKey = createHmac("sha1", secretKey).update(signTime).digest("hex");

  const httpString = [method, `/${key}`, "", "", ""].join("\n");
  const sha1edHttpString = createHash("sha1").update(httpString).digest("hex");
  const stringToSign = ["sha1", signTime, sha1edHttpString, ""].join("\n");
  const signature = createHmac("sha1", signKey).update(stringToSign).digest("hex");

  const params = [
    `q-sign-algorithm=sha1`,
    `q-ak=${secretId}`,
    `q-sign-time=${signTime}`,
    `q-key-time=${signTime}`,
    `q-header-list=`,
    `q-url-param-list=`,
    `q-signature=${signature}`,
  ].join("&");

  return `https://${host}/${key}?${params}`;
}

function getCosKeyFromUrl(url: string): string | null {
  const prefix = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length).split("?")[0];
  }
  return null;
}

// GET - 获取预签名上传 URL（直连 COS）
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const secretId = (process.env.COS_SECRET_ID || "").trim();
    const secretKey = (process.env.COS_SECRET_KEY || "").trim();
    if (!secretId || !secretKey) {
      return NextResponse.json({ error: "COS 未配置" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "image.jpg";

    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const allowedExts = ["jpg", "jpeg", "png"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG 格式" }, { status: 400 });
    }

    const rand = Math.random().toString(36).slice(2, 8);
    const key = `ipoa/2026/${Date.now()}_${rand}.${ext}`;

    const uploadUrl = getCosPresignedUrl(key, secretId, secretKey);
    const imageUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;

    return NextResponse.json({ uploadUrl, imageUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Get upload URL error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - 删除 COS 文件
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const secretId = (process.env.COS_SECRET_ID || "").trim();
    const secretKey = (process.env.COS_SECRET_KEY || "").trim();
    if (!secretId || !secretKey) {
      return NextResponse.json({ error: "COS 未配置" }, { status: 500 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "缺少文件 URL" }, { status: 400 });
    }

    const key = getCosKeyFromUrl(url);
    if (!key) {
      return NextResponse.json({ error: "无效的 COS URL" }, { status: 400 });
    }

    const deleteUrl = getCosPresignedUrl(key, secretId, secretKey, "delete");
    const res = await fetch(deleteUrl, { method: "DELETE" });

    if (!res.ok && res.status !== 404) {
      return NextResponse.json({ error: `删除失败 (${res.status})` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Delete COS file error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
