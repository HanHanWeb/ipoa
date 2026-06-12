function getEndpoint() {
  return (process.env.CASDOOR_ENDPOINT || "").replace(/\/+$/, "");
}
function getClientId() {
  return process.env.CASDOOR_CLIENT_ID || "";
}
function getClientSecret() {
  return process.env.CASDOOR_CLIENT_SECRET || "";
}
function getApplication() {
  return process.env.CASDOOR_APPLICATION || "";
}
function getOrganization() {
  return process.env.CASDOOR_ORGANIZATION || "";
}

// PKCE helpers
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getAuthUrl(redirectUri: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: crypto.randomUUID(),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  const app = getApplication();
  if (app) params.set("application", app);
  return `${getEndpoint()}/login/oauth/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string, redirectUri: string, codeVerifier: string): Promise<string> {
  const url = `${getEndpoint()}/api/login/oauth/access_token`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const text = await res.text();

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
  const res = await fetch(`${getEndpoint()}/api/userinfo`, {
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
