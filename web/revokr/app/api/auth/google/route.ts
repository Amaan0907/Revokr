import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_OAUTH_COOKIE, googleOAuthConfig, safeNextPath } from "@/lib/auth-config";

// Starts Google sign-in (OpenID Connect, authorization code flow with PKCE).
export async function GET(request: NextRequest) {
  const config = googleOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: new URL("/api/auth/google/callback", request.nextUrl.origin).toString(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 600,
  });
  return response;
}
