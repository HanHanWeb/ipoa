import { NextResponse } from "next/server";
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
    
    // Step 1: Exchange code for token
    console.log("Step 1: Exchanging code for token...");
    const accessToken = await getAccessToken(code, redirectUri);
    console.log("Step 1: Got access token");
    
    // Step 2: Get user info
    console.log("Step 2: Getting user info...");
    const casdoorUser = await getUserInfo(accessToken);
    console.log("Step 2: Got user info:", casdoorUser.name, casdoorUser.id);
    
    // Step 3: Initialize database
    console.log("Step 3: Initializing database...");
    console.log("DB URL:", process.env.TURSO_DATABASE_URL ? "set" : "NOT SET");
    console.log("DB Token:", process.env.TURSO_AUTH_TOKEN ? "set" : "NOT SET");
    await initDb();
    console.log("Step 3: Database initialized");
    
    // Step 4: Check if user exists
    console.log("Step 4: Checking if user exists...");
    const existing = await getDb().execute({
      sql: "SELECT * FROM users WHERE casdoor_id = ?",
      args: [casdoorUser.id],
    });
    console.log("Step 4: Found", existing.rows.length, "existing users");

    if (existing.rows.length === 0) {
      // Check if this is the first user (admin)
      const count = await getDb().execute("SELECT COUNT(*) as cnt FROM users");
      const isFirst = (count.rows[0].cnt as number) === 0;
      console.log("Step 5: Creating new user, isFirst:", isFirst);

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
      console.log("Step 5: User created successfully");
    } else {
      // Update last login
      await getDb().execute({
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
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Auth Error: ${errorMsg}`, { status: 500 });
  }
}
