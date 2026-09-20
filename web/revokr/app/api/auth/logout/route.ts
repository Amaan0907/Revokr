import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin, siteOrigin } from "@/lib/auth-config";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const response = NextResponse.redirect(new URL("/", siteOrigin(request)), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  return response;
}
