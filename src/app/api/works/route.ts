import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function ensureReviewColumns() {
  const alterCols = [
    ["review_status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["review_comment", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of alterCols) {
    try {
      await getDb().execute(`ALTER TABLE submissions ADD COLUMN ${col} ${def}`);
    } catch {}
  }
}

// List all submissions (admin/reviewer)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();

    const me = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (me.rows.length === 0 || !["admin", "reviewer"].includes(me.rows[0].role as string)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureReviewColumns();

    const result = await getDb().execute(
      `SELECT s.id, s.user_id, s.work_type, s.owner, s.title, s.description, s.image_url,
              s.created_at, s.version, s.completion_date, s.contact, s.os, s.tool, s.source_url,
              s.review_status, s.review_comment,
              u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar
       FROM submissions s
       LEFT JOIN users u ON u.casdoor_id = s.user_id
       ORDER BY s.created_at DESC`
    );

    return NextResponse.json({ works: result.rows, role: me.rows[0].role });
  } catch (err) {
    console.error("List works error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// Review a submission (reviewer only)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();

    const me = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (me.rows.length === 0 || me.rows[0].role !== "reviewer") {
      return NextResponse.json({ error: "仅审核员可审核作品" }, { status: 403 });
    }

    await ensureReviewColumns();

    const { submissionId, review_status, review_comment } = await request.json();
    if (!submissionId || !["approved", "rejected"].includes(review_status)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    await getDb().execute({
      sql: "UPDATE submissions SET review_status = ?, review_comment = ? WHERE id = ?",
      args: [review_status, review_comment || "", submissionId],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
