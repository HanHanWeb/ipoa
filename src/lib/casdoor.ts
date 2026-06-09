const CASDOOR_ENDPOINT = process.env.CASDOOR_ENDPOINT!.replace(/\/+$/, "");
const CLIENT_ID = process.env.CASDOOR_CLIENT_ID!;
const CLIENT_SECRET = process.env.CASDOOR_CLIENT_SECRET!;

export function getAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: crypto.randomUUID(),
  });
  return `${CASDOOR_ENDPOINT}/login/oauth/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string, redirectUri: string): Promise<string> {
  const url = `${CASDOOR_ENDPOINT}/api/login/oauth/access_token`;
  console.log("Token exchange URL:", url);
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  
  const text = await res.text();
  console.log("Token response status:", res.status, "body:", text.substring(0, 500));
  
  try {
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error_description || data.error);
    return data.access_token;
  } catch {
    throw new Error(`Token exchange failed: ${res.status} ${text.substring(0, 200)}`);
  }
}

export interface CasdoorUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export async function getUserInfo(accessToken: string): Promise<CasdoorUser> {
  const res = await fetch(`${CASDOOR_ENDPOINT}/api/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return {
    id: data.sub || data.id,
    name: data.name || data.preferred_username || "",
    email: data.email || "",
    avatar: data.picture || data.avatar || "",
  };
}
