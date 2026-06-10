import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, createHash } from "node:crypto";

const COS_BUCKET = "intereco-basic-1305364972";
const COS_REGION = "ap-nanjing";

export async function POST(request: Request) {
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

    const filename = request.headers.get("X-Filename") || "image.jpg";
    const fileBuffer = await request.arrayBuffer();
    if (fileBuffer.byteLength === 0) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }
    if (fileBuffer.byteLength > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "文件超过 3MB" }, { status: 400 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const key = `ipoa/2026/${Date.now()}.${ext}`;
    const host = `${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;

    const now = Math.floor(Date.now() / 1000);
    const expire = now + 600;
    const signTime = `${now};${expire}`;
    const signKey = createHmac("sha1", secretKey).update(signTime).digest("hex");

    const httpString = ["put", `/${key}`, "", "", ""].join("\n");
    const sha1edHttpString = createHash("sha1").update(httpString).digest("hex");
    const stringToSign = ["sha1", signTime, sha1edHttpString, ""].join("\n");
    const signature = createHmac("sha1", signKey).update(stringToSign).digest("hex");

    const authorization = [
      `q-sign-algorithm=sha1`,
      `q-ak=${secretId}`,
      `q-sign-time=${signTime}`,
      `q-key-time=${signTime}`,
      `q-header-list=`,
      `q-url-param-list=`,
      `q-signature=${signature}`,
    ].join("&");

    const cosUrl = `https://${host}/${key}`;

    console.log("COS debug:", JSON.stringify({
      signTime,
      signKey: signKey.slice(0, 8) + "...",
      httpString,
      sha1edHttpString,
      stringToSign: stringToSign.replace(/\n/g, "\\n"),
      signature: signature.slice(0, 8) + "...",
      skLen: secretKey.length,
      skPrefix: secretKey.slice(0, 4),
    }));

    const cosRes = await fetch(cosUrl, {
      method: "PUT",
      headers: { Authorization: authorization },
      body: fileBuffer,
    });

    if (!cosRes.ok) {
      const errBody = await cosRes.text();
      console.error("COS upload failed:", cosRes.status, errBody);
      return NextResponse.json(
        { error: `COS 上传失败 (${cosRes.status})`, detail: errBody.slice(0, 500) },
        { status: 500 }
      );
    }

    const imageUrl = cosUrl;
    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
