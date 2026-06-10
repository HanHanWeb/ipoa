import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function ensureSettingsTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const result = await getDb().execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key],
  });
  return result.rows.length > 0 ? (result.rows[0].value as string) : fallback;
}

async function setSetting(key: string, value: string) {
  await getDb().execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    args: [key, value],
  });
}

export async function GET() {
  try {
    await initDb();
    await ensureSettingsTable();

    const eventStart = await getSetting("event_start", "2026-07-01T00:00:00+08:00");
    const eventEnd = await getSetting("event_end", "2026-08-31T23:59:59+08:00");

    return NextResponse.json({ event_start: eventStart, event_end: eventEnd });
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    await ensureSettingsTable();

    const { event_start, event_end } = await request.json();
    if (event_start) await setSetting("event_start", event_start);
    if (event_end) await setSetting("event_end", event_end);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
