import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import COS from "cos-nodejs-sdk-v5";

const COS_BUCKET = "intereco-basic-1305364972";
const COS_REGION = "ap-nanjing";

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

    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const key = `ipoa/2026/${safeId}/${Date.now()}.${ext}`;

    const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

    const uploadUrl = cos.getObjectUrl({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Method: "PUT",
      Expires: 600,
    });

    const imageUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;

    return NextResponse.json({ uploadUrl, imageUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
