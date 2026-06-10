import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const COS_BUCKET = "intereco-basic-1305364972";
const COS_REGION = "ap-nanjing";

function getSecretId() {
  return process.env.COS_SECRET_ID || "";
}
function getSecretKey() {
  return process.env.COS_SECRET_KEY || "";
}

function sign(key: string, msg: string) {
  return crypto.createHmac("sha1", key).update(msg).digest("hex");
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const secretId = getSecretId();
    const secretKey = getSecretKey();
    if (!secretId || !secretKey) {
      return NextResponse.json({ error: "COS 未配置" }, { status: 500 });
    }

    const { filename, contentType } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    const ext = filename.split(".").pop() || "jpg";
    const key = `ipoa/2026/${userId}/${Date.now()}.${ext}`;
    const now = Math.floor(Date.now() / 1000);
    const expire = now + 600; // 10 minutes

    // Generate presigned URL
    const signTime = `${now};${expire}`;
    const signKey = sign(secretKey, signTime);
    const httpString = `put\n/${key}\n\nhost=${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com\n`;
    const sha1edHttpString = crypto.createHash("sha1").update(httpString).digest("hex");
    const signStr = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${signTime}&q-key-time=${signTime}&q-header-list=host&q-url-param-list=&q-signature=${sign(signKey, sha1edHttpString)}`;

    const uploadUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}?${signStr}`;
    const imageUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;

    return NextResponse.json({ uploadUrl, imageUrl, key });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
