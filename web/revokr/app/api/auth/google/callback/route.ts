import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_OAUTH_COOKIE, googleOAuthConfig, safeNextPath, siteOrigin } from "@/lib/auth-config";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function fail(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, siteOrigin(request)));
  response.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth" });
  return response;
}

export async function GET(request: NextRequest) {
  const config = googleOAuthConfig();
  if (!config) return fail(request, "google_not_configured");

  const params = request.nextUrl.searchParams;
  if (params.get("error") === "access_denied") return fail(request, "access_denied");

  const code = params.get("code");
  const state = params.get("state");
  let stored: { state?: string; verifier?: string; next?: string } = {};
  try {
    stored = JSON.parse(request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value ?? "{}");
  } catch {
    stored = {};
  }
  const verifier = stored.verifier;
  if (!code || !state || state !== stored.state || !verifier) {
    return fail(request, "state_mismatch");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: new URL("/api/auth/google/callback", siteOrigin(request)).toString(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  const token = (await tokenResponse.json().catch(() => null)) as { access_token?: string } | null;
  if (!tokenResponse.ok || !token?.access_token) return fail(request, "oauth_failed");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!profileResponse.ok) return fail(request, "oauth_failed");
  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.sub || !profile.email) return fail(request, "oauth_failed");
  if (profile.email_verified !== true) return fail(request, "email_unverified");

  // Only the profile is kept. The Google access token isn't needed after this, so it isn't stored.
  const session = encodeSession(
    {
      mode: "google",
      user: {
        id: profile.sub,
        login: profile.email,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        email: profile.email,
      },
    },
    null,
  );

  const response = NextResponse.redirect(new URL(safeNextPath(stored.next), siteOrigin(request)));
  response.cookies.set(SESSION_COOKIE, session.value, sessionCookieOptions(session.maxAge));
  response.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth" });
  return response;
}
