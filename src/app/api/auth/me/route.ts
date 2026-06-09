import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, initDb } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    await initDb();
    const result = await db.execute({
      sql: "SELECT casdoor_id, name, email, avatar, role FROM users WHERE casdoor_id = ?",
      args: [userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      user: {
        id: row.casdoor_id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        role: row.role,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    return NextResponse.json({ user: null });
  }
}
