import { NextResponse, type NextRequest } from "next/server";
import { DEMO_USER, isSameOrigin, safeNextPath, siteOrigin } from "@/lib/auth-config";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const form = await request.formData();
  const next = safeNextPath(form.get("next")?.toString());

  const session = encodeSession({ mode: "demo", user: DEMO_USER }, null);
  const response = NextResponse.redirect(new URL(next, siteOrigin(request)), 303);
  response.cookies.set(SESSION_COOKIE, session.value, sessionCookieOptions(session.maxAge));
  return response;
}
