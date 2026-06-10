import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function ensureNoticesTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// Public: get published notices
export async function GET() {
  try {
    await initDb();
    await ensureNoticesTable();

    const result = await getDb().execute(
      "SELECT id, title, content, pinned, created_at FROM notices ORDER BY pinned DESC, created_at DESC"
    );

    return NextResponse.json({ notices: result.rows });
  } catch (err) {
    console.error("Get notices error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// Admin: create notice
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();

    const admin = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (admin.rows.length === 0 || admin.rows[0].role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureNoticesTable();

    const { title, content, pinned } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    await getDb().execute({
      sql: "INSERT INTO notices (title, content, pinned) VALUES (?, ?, ?)",
      args: [title, content, pinned ? 1 : 0],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Create notice error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// Admin: delete notice
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();

    const admin = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (admin.rows.length === 0 || admin.rows[0].role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureNoticesTable();

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }

    await getDb().execute({
      sql: "DELETE FROM notices WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete notice error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
