import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

async function ensureScoresTable() {
  try {
    await getDb().execute(
      `CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        reviewer_id TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        comment TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(submission_id, reviewer_id)
      )`
    );
  } catch {}
}

// GET scores for a submission
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();
    await ensureScoresTable();

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const me = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (me.rows.length === 0 || !["admin", "reviewer"].includes(me.rows[0].role as string)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const result = await getDb().execute({
      sql: `SELECT s.*, u.name AS reviewer_name, u.avatar AS reviewer_avatar
            FROM scores s
            LEFT JOIN users u ON u.casdoor_id = s.reviewer_id
            WHERE s.submission_id = ?
            ORDER BY s.updated_at DESC`,
      args: [submissionId],
    });

    // Get all reviewers and admins
    const allReviewers = await getDb().execute({
      sql: `SELECT casdoor_id, name, avatar FROM users WHERE role = 'reviewer' ORDER BY name`,
      args: [],
    });

    // Get final_score from submission
    const submissionResult = await getDb().execute({
      sql: "SELECT final_score FROM submissions WHERE id = ?",
      args: [submissionId],
    });
    const finalScore = submissionResult.rows.length > 0 ? submissionResult.rows[0].final_score : null;

    return NextResponse.json({
      scores: result.rows,
      reviewers: allReviewers.rows.map((r) => ({
        id: r.casdoor_id,
        name: r.name,
        avatar: r.avatar,
      })),
      final_score: finalScore,
    });
  } catch (err) {
    console.error("Get scores error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST - create or update a score
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();
    await ensureScoresTable();

    const me = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (me.rows.length === 0 || me.rows[0].role !== "reviewer") {
      return NextResponse.json({ error: "仅评委可打分" }, { status: 403 });
    }

    // Check if review stage has started
    const stageReview = await getDb().execute({
      sql: "SELECT value FROM settings WHERE key = 'stage_review_start'",
      args: [],
    });
    if (stageReview.rows.length > 0) {
      const reviewDate = new Date(stageReview.rows[0].value as string);
      if (!isNaN(reviewDate.getTime()) && new Date() < reviewDate) {
        return NextResponse.json({ error: "评审尚未开始，无法打分" }, { status: 400 });
      }
    }

    // Check if in result announcement stage (scoring disabled)
    const stageResult = await getDb().execute({
      sql: "SELECT value FROM settings WHERE key = 'stage_result_start'",
      args: [],
    });
    if (stageResult.rows.length > 0) {
      const resultDate = new Date(stageResult.rows[0].value as string);
      if (!isNaN(resultDate.getTime()) && new Date() >= resultDate) {
        return NextResponse.json({ error: "已进入公示阶段，无法打分" }, { status: 400 });
      }
    }

    const { submissionId, score, comment } = await request.json();
    if (!submissionId || score === undefined || score < 0 || score > 100) {
      return NextResponse.json({ error: "参数错误，分数需在0-100之间" }, { status: 400 });
    }

    await getDb().execute({
      sql: `INSERT INTO scores (submission_id, reviewer_id, score, comment, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(submission_id, reviewer_id)
            DO UPDATE SET score = ?, comment = ?, updated_at = datetime('now')`,
      args: [submissionId, userId, score, comment || "", score, comment || ""],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Score error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// PUT - admin set final score
export async function PUT(request: Request) {
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
    if (me.rows.length === 0 || me.rows[0].role !== "admin") {
      return NextResponse.json({ error: "仅管理员可设定最终分数" }, { status: 403 });
    }

    const { submissionId, finalScore } = await request.json();
    if (!submissionId || finalScore === undefined || finalScore === null || finalScore < 0 || finalScore > 100) {
      return NextResponse.json({ error: "参数错误，分数需在0-100之间" }, { status: 400 });
    }

    await getDb().execute({
      sql: "UPDATE submissions SET final_score = ? WHERE id = ?",
      args: [finalScore, submissionId],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Set final score error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
