import type { NextRequest } from "next/server";

export const OAUTH_STATE_COOKIE = "revokr_oauth";

export const DEMO_USER = {
  id: 0,
  login: "demo",
  name: "Demo operator",
  avatarUrl: null,
};

export function githubOAuthConfig() {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  // A real GitHub session carries an access token, so it needs a stable, configured signing secret.
  if (!clientId || !clientSecret || !process.env.SESSION_SECRET) return null;
  return { clientId, clientSecret };
}

export function isGitHubLoginEnabled(): boolean {
  return githubOAuthConfig() !== null;
}

// Only same-site paths, so a crafted ?next= can't bounce a signed-in user to another site.
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === request.nextUrl.origin;
}

export const AUTH_ERRORS: Record<string, string> = {
  github_not_configured: "GitHub sign-in isn't set up on this deployment yet. Try the live demo instead.",
  access_denied: "You cancelled the GitHub sign-in. Nothing was shared.",
  state_mismatch: "That sign-in link expired or was already used. Please try again.",
  oauth_failed: "GitHub didn't accept the sign-in. Please try again.",
};
