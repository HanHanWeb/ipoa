import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const result = await getDb().execute({
      sql: "SELECT value FROM settings WHERE key = ?",
      args: [key],
    });
    return result.rows.length > 0 ? (result.rows[0].value as string) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function verifyHCaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (!secret) {
      console.error("HCAPTCHA_SECRET_KEY not configured");
      return false;
    }
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function ensureSubmissionsTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      work_type TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(casdoor_id)
    )
  `);
  // Add new columns if missing
  const alterCols = [
    ["work_type", "TEXT NOT NULL DEFAULT ''"],
    ["version", "TEXT NOT NULL DEFAULT ''"],
    ["completion_date", "TEXT NOT NULL DEFAULT ''"],
    ["contact", "TEXT NOT NULL DEFAULT ''"],
    ["os", "TEXT NOT NULL DEFAULT ''"],
    ["tool", "TEXT NOT NULL DEFAULT ''"],
    ["source_name", "TEXT NOT NULL DEFAULT ''"],
    ["download_url", "TEXT NOT NULL DEFAULT ''"],
    ["work_note", "TEXT NOT NULL DEFAULT ''"],
    ["final_score", "INTEGER DEFAULT NULL"],
  ];
  for (const [col, def] of alterCols) {
    try {
      await getDb().execute(`ALTER TABLE submissions ADD COLUMN ${col} ${def}`);
    } catch {}
  }
  // Migrate source_url -> source_name
  try {
    await getDb().execute(`ALTER TABLE submissions RENAME COLUMN source_url TO source_name`);
  } catch {}
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
      sql: "SELECT id, work_type, owner, title, description, image_url, created_at, version, completion_date, contact, os, tool, source_name, download_url, work_note, final_score FROM submissions WHERE user_id = ? ORDER BY created_at DESC",
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

    // Check if upload stage has started
    await initDb();
    await getDb().execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    const stageResult = await getDb().execute({
      sql: "SELECT value FROM settings WHERE key = ?",
      args: ["stage_upload_start"],
    });
    const stageUploadStart = stageResult.rows.length > 0
      ? new Date(stageResult.rows[0].value as string)
      : new Date("2026-07-01T00:00:00+08:00");
    if (new Date() < stageUploadStart) {
      return NextResponse.json({ error: "作品提交暂未开放，请在活动第一阶段开始后再提交" }, { status: 400 });
    }

    // Check if already submitted
    const existing = await getDb().execute({
      sql: "SELECT id FROM submissions WHERE user_id = ?",
      args: [userId],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "您已提交过作品，不能重复提交" }, { status: 400 });
    }

    await initDb();
    await ensureSubmissionsTable();

    const { work_type, owner, title, description, image_urls, version, completion_date, contact, os, tool, source_name, download_url, work_note, hcaptcha_token } = await request.json();

    // Verify hCaptcha
    if (!hcaptcha_token || !(await verifyHCaptcha(hcaptcha_token))) {
      return NextResponse.json({ error: "人机验证失败" }, { status: 400 });
    }

    if (!work_type || !owner || !title || !description || !image_urls || !Array.isArray(image_urls) || image_urls.length === 0 || !download_url) {
      return NextResponse.json({ error: "所有字段均为必填" }, { status: 400 });
    }

    const imageUrl = JSON.stringify(image_urls);

    await getDb().execute({
      sql: "INSERT INTO submissions (user_id, work_type, owner, title, description, image_url, version, completion_date, contact, os, tool, source_name, download_url, work_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [userId, work_type, owner, title, description, imageUrl, version || "", completion_date || "", contact || "", os || "", tool || "", source_name || "", download_url || "", work_note || ""],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Create submission error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// Edit submission (before review stage)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // Check if review stage has started
    await initDb();
    const stageReviewStart = await getSetting("stage_review_start", "2026-08-15T00:00:00+08:00");
    const reviewDate = new Date(stageReviewStart);
    if (!isNaN(reviewDate.getTime()) && new Date() >= reviewDate) {
      return NextResponse.json({ error: "评审已开始，无法修改作品" }, { status: 400 });
    }

    const { submissionId, work_type, owner, title, description, image_urls, version, completion_date, contact, os, tool, source_name, download_url, work_note, hcaptcha_token } = await request.json();

    // Verify hCaptcha
    if (!hcaptcha_token || !(await verifyHCaptcha(hcaptcha_token))) {
      return NextResponse.json({ error: "人机验证失败" }, { status: 400 });
    }

    if (!submissionId) {
      return NextResponse.json({ error: "缺少作品ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await getDb().execute({
      sql: "SELECT id FROM submissions WHERE id = ? AND user_id = ?",
      args: [submissionId, userId],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "作品不存在或无权限修改" }, { status: 403 });
    }

    if (!work_type || !owner || !title || !description || !image_urls || !Array.isArray(image_urls) || image_urls.length === 0 || !download_url) {
      return NextResponse.json({ error: "所有字段均为必填" }, { status: 400 });
    }

    const imageUrl = JSON.stringify(image_urls);

    await getDb().execute({
      sql: `UPDATE submissions SET work_type = ?, owner = ?, title = ?, description = ?, image_url = ?,
            version = ?, completion_date = ?, contact = ?, os = ?, tool = ?, source_name = ?, download_url = ?, work_note = ? WHERE id = ? AND user_id = ?`,
      args: [work_type, owner, title, description, imageUrl, version || "", completion_date || "", contact || "", os || "", tool || "", source_name || "", download_url || "", work_note || "", submissionId, userId],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Edit submission error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
