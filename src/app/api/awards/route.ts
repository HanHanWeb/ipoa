import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

// In-memory cache
let awardsCache: { categories: unknown[]; entries: unknown[]; enabled: boolean } | null = null;
let awardsCacheTime = 0;
const AWARDS_CACHE_TTL = 60_000; // 60s

function invalidateAwardsCache() {
  awardsCache = null;
}

async function ensureAwardsTable() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS award_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      ratio TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS award_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      work_title TEXT NOT NULL,
      authors TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 如果没有奖项分类，插入默认的6个奖项
  const count = await getDb().execute("SELECT COUNT(*) as cnt FROM award_categories");
  if (count.rows[0].cnt === 0) {
    const defaultCategories = [
      { title: "一等奖", ratio: "占总参赛作品的 10%", sort_order: 0 },
      { title: "二等奖", ratio: "占总参赛作品的 20%", sort_order: 1 },
      { title: "三等奖", ratio: "占总参赛作品的 30%", sort_order: 2 },
      { title: "优秀奖", ratio: "占总参赛作品的 40%", sort_order: 3 },
      { title: "黑马突围奖", ratio: "共 3 名", sort_order: 4 },
      { title: "人气之星", ratio: "共 1 名（社区投票）", sort_order: 5 },
    ];
    for (const cat of defaultCategories) {
      await getDb().execute({
        sql: "INSERT INTO award_categories (title, ratio, sort_order) VALUES (?, ?, ?)",
        args: [cat.title, cat.ratio, cat.sort_order],
      });
    }
  }
}

// GET - 获取获奖名单
export async function GET() {
  try {
    const now = Date.now();
    if (awardsCache && now - awardsCacheTime < AWARDS_CACHE_TTL) {
      return NextResponse.json(awardsCache);
    }

    await initDb();
    await ensureAwardsTable();

    const categories = await getDb().execute(
      "SELECT * FROM award_categories ORDER BY sort_order ASC, id ASC"
    );

    const entries = await getDb().execute(
      "SELECT * FROM award_entries ORDER BY sort_order ASC, id ASC"
    );

    // 获取设置中的开关状态
    const setting = await getDb().execute({
      sql: "SELECT value FROM settings WHERE key = 'awards_page_enabled'",
      args: [],
    });
    const enabled = setting.rows.length > 0 ? setting.rows[0].value === "true" : false;

    const data = { categories: categories.rows, entries: entries.rows, enabled };
    awardsCache = data;
    awardsCacheTime = now;

    return NextResponse.json(data);
  } catch (err) {
    console.error("Get awards error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST - 添加奖项分类
export async function POST(request: Request) {
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
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureAwardsTable();

    const { title, ratio, sort_order } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "奖项名称不能为空" }, { status: 400 });
    }

    await getDb().execute({
      sql: "INSERT INTO award_categories (title, ratio, sort_order) VALUES (?, ?, ?)",
      args: [title, ratio || "", sort_order || 0],
    });

    invalidateAwardsCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Create award category error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// PUT - 更新奖项分类或添加/更新获奖作品
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
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureAwardsTable();

    const body = await request.json();

    // 更新奖项分类
    if (body.type === "category") {
      const { id, title, ratio, sort_order } = body;
      if (!id || !title) {
        return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
      }
      await getDb().execute({
        sql: "UPDATE award_categories SET title = ?, ratio = ?, sort_order = ? WHERE id = ?",
        args: [title, ratio || "", sort_order || 0, id],
      });
    }
    // 添加获奖作品
    else if (body.type === "entry") {
      const { category_id, work_title, authors, description, sort_order } = body;
      if (!category_id || !work_title) {
        return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
      }
      await getDb().execute({
        sql: "INSERT INTO award_entries (category_id, work_title, authors, description, sort_order) VALUES (?, ?, ?, ?, ?)",
        args: [category_id, work_title, JSON.stringify(authors || []), description || "", sort_order || 0],
      });
    }
    // 更新获奖作品
    else if (body.type === "update_entry") {
      const { id, work_title, authors, description, sort_order } = body;
      if (!id || !work_title) {
        return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
      }
      await getDb().execute({
        sql: "UPDATE award_entries SET work_title = ?, authors = ?, description = ?, sort_order = ? WHERE id = ?",
        args: [work_title, JSON.stringify(authors || []), description || "", sort_order || 0, id],
      });
    }
    // 更新开关状态
    else if (body.type === "toggle") {
      const { enabled } = body;
      await getDb().execute({
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('awards_page_enabled', ?)",
        args: [enabled ? "true" : "false"],
      });
    }

    invalidateAwardsCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update award error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// DELETE - 删除奖项分类或获奖作品
export async function DELETE(request: Request) {
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
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await ensureAwardsTable();

    const { type, id } = await request.json();

    if (type === "category") {
      // 删除分类及其所有作品
      await getDb().execute({
        sql: "DELETE FROM award_entries WHERE category_id = ?",
        args: [id],
      });
      await getDb().execute({
        sql: "DELETE FROM award_categories WHERE id = ?",
        args: [id],
      });
    } else if (type === "entry") {
      await getDb().execute({
        sql: "DELETE FROM award_entries WHERE id = ?",
        args: [id],
      });
    }

    invalidateAwardsCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete award error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
