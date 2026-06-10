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
    const contentLength = String(fileBuffer.byteLength);

    const now = Math.floor(Date.now() / 1000);
    const expire = now + 600;
    const signTime = `${now};${expire}`;
    const signKey = await hmacSha1(secretKey, signTime);
    const httpString = ["put", `/${key}`, "", `content-length=${contentLength}&host=${host}`, ""].join("\n");
    const sha1edHttpString = await sha1Hex(httpString);
    const stringToSign = ["sha1", signTime, sha1edHttpString, ""].join("\n");
    const signature = await hmacSha1(signKey, stringToSign);

    const authorization = [
      `q-sign-algorithm=sha1`,
      `q-ak=${secretId}`,
      `q-sign-time=${signTime}`,
      `q-key-time=${signTime}`,
      `q-header-list=content-length;host`,
      `q-url-param-list=`,
      `q-signature=${signature}`,
    ].join("&");

    const cosUrl = `https://${host}/${key}`;

    const cosRes = await fetch(cosUrl, {
      method: "PUT",
      headers: {
        Host: host,
        "Content-Length": contentLength,
        Authorization: authorization,
      },
      body: fileBuffer,
    });

    if (!cosRes.ok) {
      const errBody = await cosRes.text();
      console.error("COS upload failed:", cosRes.status, errBody);
      return NextResponse.json(
        { error: `COS 上传失败 (${cosRes.status})` },
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
