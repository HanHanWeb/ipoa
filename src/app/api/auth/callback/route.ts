import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAccessToken, getUserInfo } from "@/lib/casdoor";
import { getDb, initDb } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", url.origin));
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;

    // Read PKCE verifier from cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("pkce_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(new URL("/?error=missing_pkce_verifier", url.origin));
    }

    const accessToken = await getAccessToken(code, redirectUri, codeVerifier);
    const casdoorUser = await getUserInfo(accessToken);

    await initDb();
    const existing = await getDb().execute({
      sql: "SELECT * FROM users WHERE casdoor_id = ?",
      args: [casdoorUser.id],
    });

    if (existing.rows.length === 0) {
      const count = await getDb().execute("SELECT COUNT(*) as cnt FROM users");
      const isFirst = (count.rows[0].cnt as number) === 0;

      await getDb().execute({
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
      await getDb().execute({
        sql: "UPDATE users SET last_login = datetime('now'), name = ?, email = ?, avatar = ? WHERE casdoor_id = ?",
        args: [casdoorUser.name, casdoorUser.email, casdoorUser.avatar, casdoorUser.id],
      });
    }

    // Set session cookie and clear PKCE verifier
    const response = NextResponse.redirect(new URL("/", url.origin));
    response.cookies.set("session_user_id", casdoorUser.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.delete("pkce_verifier");

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Auth Error: ${errorMsg}`, { status: 500 });
  }
}
