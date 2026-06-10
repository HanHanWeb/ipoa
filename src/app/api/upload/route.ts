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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const key = `ipoa/2026/${userId}/${Date.now()}.${ext}`;
    const host = `${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const now = Math.floor(Date.now() / 1000);
    const expire = now + 600;
    const signTime = `${now};${expire}`;
    const signKey = sign(secretKey, signTime);
    const httpString = `put\n/${key}\n\nhost=${host}\n`;
    const sha1edHttpString = crypto.createHash("sha1").update(httpString).digest("hex");
    const signature = sign(signKey, sha1edHttpString);
    const auth = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${signTime}&q-key-time=${signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature}`;

    const cosRes = await fetch(`https://${host}/${key}`, {
      method: "PUT",
      headers: {
        "Host": host,
        "Authorization": auth,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!cosRes.ok) {
      const errText = await cosRes.text();
      console.error("COS upload failed:", cosRes.status, errText);
      return NextResponse.json({ error: "上传到 COS 失败" }, { status: 500 });
    }

    const imageUrl = `https://${host}/${key}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
