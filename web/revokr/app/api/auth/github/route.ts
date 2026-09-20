import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { githubOAuthConfig, OAUTH_STATE_COOKIE, safeNextPath, siteOrigin } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  const config = githubOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=github_not_configured", siteOrigin(request)));
  }

  const state = randomBytes(16).toString("hex");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set(
    "redirect_uri",
    new URL("/api/auth/github/callback", siteOrigin(request)).toString(),
  );
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 600,
  });
  return response;
}
