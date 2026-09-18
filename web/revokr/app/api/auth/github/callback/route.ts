import { NextResponse, type NextRequest } from "next/server";
import { githubOAuthConfig, OAUTH_STATE_COOKIE, safeNextPath } from "@/lib/auth-config";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

function fail(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth" });
  return response;
}

export async function GET(request: NextRequest) {
  const config = githubOAuthConfig();
  if (!config) return fail(request, "github_not_configured");

  const params = request.nextUrl.searchParams;
  if (params.get("error") === "access_denied") return fail(request, "access_denied");

  const code = params.get("code");
  const state = params.get("state");
  let stored: { state?: string; next?: string } = {};
  try {
    stored = JSON.parse(request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? "{}");
  } catch {
    stored = {};
  }
  if (!code || !state || state !== stored.state) return fail(request, "state_mismatch");

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: new URL("/api/auth/github/callback", request.nextUrl.origin).toString(),
    }),
    cache: "no-store",
  });
  const token = (await tokenResponse.json().catch(() => null)) as { access_token?: string } | null;
  if (!token?.access_token) return fail(request, "oauth_failed");

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!userResponse.ok) return fail(request, "oauth_failed");
  const user = (await userResponse.json()) as GitHubUser;

  const session = encodeSession(
    {
      mode: "github",
      user: {
        id: String(user.id),
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        email: user.email,
      },
    },
    token.access_token,
  );

  const response = NextResponse.redirect(new URL(safeNextPath(stored.next), request.url));
  response.cookies.set(SESSION_COOKIE, session.value, sessionCookieOptions(session.maxAge));
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth" });
  return response;
}
