import { NextResponse } from "next/server";
import { getAuthUrl, generateCodeVerifier, generateCodeChallenge } from "@/lib/casdoor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = getAuthUrl(redirectUri, codeChallenge);
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });
  return response;
}
