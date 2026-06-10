import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await initDb();

    // Check admin
    const admin = await getDb().execute({
      sql: "SELECT role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });
    if (admin.rows.length === 0 || admin.rows[0].role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const result = await getDb().execute(
      "SELECT id, casdoor_id, name, email, avatar, role, created_at, last_login FROM users ORDER BY created_at DESC"
    );

    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const { targetId, role } = await request.json();
    if (!targetId || !["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // Prevent admin from removing their own admin role
    if (targetId === userId && role !== "admin") {
      return NextResponse.json({ error: "不能取消自己的管理员身份" }, { status: 400 });
    }

    await getDb().execute({
      sql: "UPDATE users SET role = ? WHERE casdoor_id = ?",
      args: [role, targetId],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
