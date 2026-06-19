import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

async function ensureVotesTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(submission_id, user_id)
    )
  `);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function isVotingOpen(): Promise<{ open: boolean; error?: string }> {
  const settings = await getDb().execute({
    sql: "SELECT key, value FROM settings WHERE key IN ('vote_start', 'vote_end')",
    args: [],
  });
  const map: Record<string, string> = {};
  for (const row of settings.rows) {
    map[row.key as string] = row.value as string;
  }
  const now = new Date();
  if (map.vote_start) {
    const start = new Date(map.vote_start);
    if (!isNaN(start.getTime()) && now < start) {
      return { open: false, error: "投票尚未开始" };
    }
  }
  if (map.vote_end) {
    const end = new Date(map.vote_end);
    if (!isNaN(end.getTime()) && now > end) {
      return { open: false, error: "投票已结束" };
    }
  }
  return { open: true };
}

// POST - 投票
export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const userIdMatch = cookie.match(/session_user_id=([^;]+)/);
    const userId = userIdMatch?.[1];
    if (!userId) {
      return NextResponse.json({ error: "请先登录后再投票" }, { status: 401 });
    }

    const voting = await isVotingOpen();
    if (!voting.open) {
      return NextResponse.json({ error: voting.error }, { status: 400 });
    }

    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: "缺少作品ID" }, { status: 400 });
    }

    await ensureVotesTable();
    const ip = getClientIp(req);

    // 检查该用户今天是否已投过票（任意作品）
    const today = new Date().toISOString().split("T")[0];
    const existing = await getDb().execute({
      sql: "SELECT id FROM votes WHERE user_id = ? AND date(created_at) = ?",
      args: [userId, today],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "今天已经投过票了，每人每天只能投一票" }, { status: 400 });
    }

    // 检查该IP今天是否已投过票
    const ipExisting = await getDb().execute({
      sql: "SELECT id FROM votes WHERE ip = ? AND date(created_at) = ?",
      args: [ip, today],
    });
    if (ipExisting.rows.length > 0) {
      return NextResponse.json({ error: "当前网络今天已经投过票了，每个IP每天只能投一票" }, { status: 400 });
    }

    await getDb().execute({
      sql: "INSERT INTO votes (submission_id, user_id, ip) VALUES (?, ?, ?)",
      args: [submissionId, userId, ip],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "投票失败" }, { status: 500 });
  }
}

// GET - 获取投票结果
export async function GET(req: NextRequest) {
  try {
    await ensureVotesTable();

    const cookie = req.headers.get("cookie") || "";
    const userIdMatch = cookie.match(/session_user_id=([^;]+)/);
    const userId = userIdMatch?.[1];

    // 获取每个作品的投票数
    const results = await getDb().execute(`
      SELECT s.id, s.title, s.owner, s.image_url, s.work_type,
             COUNT(v.id) as vote_count
      FROM submissions s
      LEFT JOIN votes v ON v.submission_id = s.id
      GROUP BY s.id
      ORDER BY vote_count DESC, s.created_at ASC
    `);

    // 获取当前用户今天是否已投票
    let votedSubmissionId: number | null = null;
    if (userId) {
      const today = new Date().toISOString().split("T")[0];
      const voted = await getDb().execute({
        sql: "SELECT submission_id FROM votes WHERE user_id = ? AND date(created_at) = ?",
        args: [userId, today],
      });
      if (voted.rows.length > 0) {
        votedSubmissionId = voted.rows[0].submission_id as number;
      }
    }

    const voting = await isVotingOpen();

    return NextResponse.json({
      works: results.rows.map((r) => ({
        id: r.id,
        title: r.title,
        owner: r.owner,
        image_url: r.image_url,
        work_type: r.work_type,
        vote_count: r.vote_count,
      })),
      votedSubmissionId,
      votingOpen: voting.open,
    });
  } catch (err) {
    console.error("Get votes error:", err);
    return NextResponse.json({ error: "获取投票数据失败" }, { status: 500 });
  }
}
