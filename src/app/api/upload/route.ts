import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COS_BUCKET = "intereco-basic-1305364972";
const COS_REGION = "ap-nanjing";

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha1(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return bufToHex(sig);
}

async function sha1Hex(msg: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await globalThis.crypto.subtle.digest("SHA-1", enc.encode(msg));
  return bufToHex(hash);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const secretId = process.env.COS_SECRET_ID || "";
    const secretKey = process.env.COS_SECRET_KEY || "";
    if (!secretId || !secretKey) {
      return NextResponse.json({ error: "COS 未配置" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ error: "仅支持 PNG / JPG" }, { status: 400 });
    }
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "文件超过 3MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const key = `ipoa/2026/${safeId}/${Date.now()}.${ext}`;
    const host = `${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;

    const now = Math.floor(Date.now() / 1000);
    const expire = now + 600;
    const signTime = `${now};${expire}`;
    const signKey = await hmacSha1(secretKey, signTime);
    const httpStr = `put\n/${key}\n\nhost=${host}\n`;
    const sha1ed = await sha1Hex(httpStr);
    const stringToSign = `sha1\n${signTime}\n${sha1ed}\n`;
    const sig = await hmacSha1(signKey, stringToSign);
    const authStr = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${signTime}&q-key-time=${signTime}&q-header-list=host&q-url-param-list=&q-signature=${sig}`;

    const cosUrl = `https://${host}/${key}`;
    const fileBuffer = await file.arrayBuffer();

    const cosRes = await fetch(cosUrl, {
      method: "PUT",
      headers: {
        Host: host,
        Authorization: authStr,
        "Content-Type": file.type,
      },
      body: fileBuffer,
    });

    if (!cosRes.ok) {
      const errBody = await cosRes.text();
      console.error("COS error:", cosRes.status, errBody);
      return NextResponse.json(
        { error: `COS 上传失败 (${cosRes.status})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: cosUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
