import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function ensureSubmissionsTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      owner TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(casdoor_id)
    )
  `);
}

// Get current user's submissions
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();
    await ensureSubmissionsTable();

    const result = await getDb().execute({
      sql: "SELECT id, owner, title, description, image_url, created_at FROM submissions WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });

    return NextResponse.json({ submissions: result.rows });
  } catch (err) {
    console.error("Get submissions error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// Create submission
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();
    await ensureSubmissionsTable();

    const { owner, title, description, image_urls } = await request.json();
    if (!owner || !title || !description || !image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: "所有字段均为必填" }, { status: 400 });
    }

    const imageUrl = JSON.stringify(image_urls);

    await getDb().execute({
      sql: "INSERT INTO submissions (user_id, owner, title, description, image_url) VALUES (?, ?, ?, ?, ?)",
      args: [userId, owner, title, description, imageUrl],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Create submission error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
