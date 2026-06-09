import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/casdoor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;
  const authUrl = getAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
