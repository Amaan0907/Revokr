import type { NextRequest } from "next/server";

export const OAUTH_STATE_COOKIE = "revokr_oauth";
export const GOOGLE_OAUTH_COOKIE = "revokr_oauth_google";

export const DEMO_USER = {
  id: "demo",
  login: "demo",
  name: "Demo operator",
  avatarUrl: null,
  email: null,
};

// Real sign-ins need a stable, configured signing secret, so each provider is only switched on
// once SESSION_SECRET is set too.
export function githubOAuthConfig() {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.SESSION_SECRET) return null;
  return { clientId, clientSecret };
}

export function googleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.SESSION_SECRET) return null;
  return { clientId, clientSecret };
}

export function isGitHubLoginEnabled(): boolean {
  return githubOAuthConfig() !== null;
}

export function isGoogleLoginEnabled(): boolean {
  return googleOAuthConfig() !== null;
}

// Only same-site paths, so a crafted ?next= can't bounce a signed-in user to another site.
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

// The address browsers use to reach this site. Behind some hosts (Amplify's proxy) the request's own
// URL reports an internal address such as https://localhost:3000, which breaks the OAuth redirect URI,
// every redirect built from the request, and the same-origin check. SITE_URL pins the real address;
// unset (local development) the request's own origin is right and is used.
export function siteOrigin(request: NextRequest): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // A malformed SITE_URL falls back rather than taking sign-in down.
    }
  }
  return request.nextUrl.origin;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === siteOrigin(request);
}

export const AUTH_ERRORS: Record<string, string> = {
  github_not_configured: "GitHub sign-in isn't set up on this deployment yet. Try the live demo instead.",
  google_not_configured: "Google sign-in isn't set up on this deployment yet. Try the live demo instead.",
  access_denied: "You cancelled the sign-in. Nothing was shared.",
  state_mismatch: "That sign-in link expired or was already used. Please try again.",
  oauth_failed: "The sign-in didn't go through. Please try again.",
  email_unverified:
    "That Google account's email address isn't verified. Verify it with Google, then try again.",
};
