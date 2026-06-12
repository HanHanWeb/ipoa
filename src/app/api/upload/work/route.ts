import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSignedUploadUrl, getS3PublicUrl, deleteFile, getKeyFromUrl } from "@/lib/s3";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

// GET - 获取预签名上传 URL
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const contentType = searchParams.get("contentType");
    const fileSize = parseInt(searchParams.get("fileSize") || "0", 10);

    if (!filename || !contentType) {
      return NextResponse.json({ error: "缺少文件名或类型" }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件超过 200MB 限制" }, { status: 400 });
    }

    // Sanitize filename
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `ipoa_upload/${userId}/${Date.now()}_${sanitized}`;

    const uploadUrl = await getSignedUploadUrl(key, contentType);
    const fileUrl = getS3PublicUrl(key);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error("Get upload URL error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// DELETE - 删除已上传文件
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { key, url } = await request.json();

    let fileKey = key;
    if (!fileKey && url) {
      fileKey = getKeyFromUrl(url);
    }

    if (!fileKey) {
      return NextResponse.json({ error: "缺少文件 key" }, { status: 400 });
    }

    // Safety: only allow deleting files in user's own directory
    if (!fileKey.startsWith(`ipoa_upload/${userId}/`)) {
      return NextResponse.json({ error: "无权删除此文件" }, { status: 403 });
    }

    await deleteFile(fileKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete file error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
