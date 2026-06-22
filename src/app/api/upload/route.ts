import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSignedUploadUrl, getS3PublicUrl, deleteFile, getKeyFromUrl } from "@/lib/s3";

// GET - 获取预签名上传 URL（图片直传 S3）
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "image.jpg";

    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const allowedExts = ["jpg", "jpeg", "png"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG 格式" }, { status: 400 });
    }

    const rand = Math.random().toString(36).slice(2, 8);
    const key = `ipoa/images/${Date.now()}_${rand}.${ext}`;
    const contentType = ext === "png" ? "image/png" : "image/jpeg";

    const uploadUrl = await getSignedUploadUrl(key, contentType);
    const imageUrl = getS3PublicUrl(key);

    return NextResponse.json({ uploadUrl, imageUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Get upload URL error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - 删除 S3 文件
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "缺少文件 URL" }, { status: 400 });
    }

    const key = getKeyFromUrl(url);
    if (!key) {
      return NextResponse.json({ error: "无效的文件 URL" }, { status: 400 });
    }

    await deleteFile(key);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Delete file error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
