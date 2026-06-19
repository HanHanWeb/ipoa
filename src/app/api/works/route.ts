import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

// List submissions - admin/reviewer see all, users see only their own
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
    if (me.rows.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 403 });
    }

    const role = me.rows[0].role as string;

    let sql: string;
    let args: (string | number | boolean | null)[] = [];

    if (["admin", "reviewer"].includes(role)) {
      sql = `SELECT s.id, s.user_id, s.work_type, s.owner, s.title, s.description, s.image_url,
              s.created_at, s.version, s.completion_date, s.contact, s.os, s.tool, s.source_name, s.download_url, s.download_code, s.work_note, s.final_score,
              u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar
       FROM submissions s
       LEFT JOIN users u ON u.casdoor_id = s.user_id
       ORDER BY s.created_at DESC`;
    } else {
      sql = `SELECT s.id, s.user_id, s.work_type, s.owner, s.title, s.description, s.image_url,
              s.created_at, s.version, s.completion_date, s.contact, s.os, s.tool, s.source_name, s.download_url, s.download_code, s.work_note, s.final_score,
              u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar
       FROM submissions s
       LEFT JOIN users u ON u.casdoor_id = s.user_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`;
      args = [userId];
    }

    const result = await getDb().execute({ sql, args });

    // Get total reviewer count
    const reviewerCountResult = await getDb().execute({
      sql: "SELECT COUNT(*) as count FROM users WHERE role = 'reviewer'",
      args: [],
    });
    const totalReviewers = Number(reviewerCountResult.rows[0]?.count || 0);

    // Get scored count per submission
    let scoreCounts: Record<number, number> = {};
    if (totalReviewers > 0 && result.rows.length > 0) {
      const submissionIds = result.rows.map((r) => r.id);
      const placeholders = submissionIds.map(() => "?").join(",");
      const scoreCountResult = await getDb().execute({
        sql: `SELECT submission_id, COUNT(DISTINCT reviewer_id) as count FROM scores WHERE submission_id IN (${placeholders}) GROUP BY submission_id`,
        args: submissionIds,
      });
      for (const row of scoreCountResult.rows) {
        scoreCounts[row.submission_id as number] = Number(row.count);
      }
    }

    // Attach scoring info to each work
    const works = result.rows.map((row) => ({
      ...row,
      scored_count: scoreCounts[row.id as number] || 0,
      total_reviewers: totalReviewers,
    }));

    return NextResponse.json({ works, role });
  } catch (err) {
    console.error("List works error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
