import { NextResponse } from "next/server";
import { getAccessToken, getUserInfo } from "@/lib/casdoor";
import { db, initDb } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", url.origin));
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;
    const accessToken = await getAccessToken(code, redirectUri);
    const casdoorUser = await getUserInfo(accessToken);

    // Ensure table exists
    await initDb();

    // Check if user exists
    const existing = await db.execute({
      sql: "SELECT * FROM users WHERE casdoor_id = ?",
      args: [casdoorUser.id],
    });

    if (existing.rows.length === 0) {
      // Check if this is the first user (admin)
      const count = await db.execute("SELECT COUNT(*) as cnt FROM users");
      const isFirst = (count.rows[0].cnt as number) === 0;

      await db.execute({
        sql: "INSERT INTO users (casdoor_id, name, email, avatar, role) VALUES (?, ?, ?, ?, ?)",
        args: [
          casdoorUser.id,
          casdoorUser.name,
          casdoorUser.email,
          casdoorUser.avatar,
          isFirst ? "admin" : "user",
        ],
      });
    } else {
      // Update last login
      await db.execute({
        sql: "UPDATE users SET last_login = datetime('now'), name = ?, email = ?, avatar = ? WHERE casdoor_id = ?",
        args: [casdoorUser.name, casdoorUser.email, casdoorUser.avatar, casdoorUser.id],
      });
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL("/", url.origin));
    response.cookies.set("session_user_id", casdoorUser.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", url.origin));
  }
}
