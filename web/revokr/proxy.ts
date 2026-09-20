import { NextResponse, type NextRequest } from "next/server";
import { siteOrigin } from "@/lib/auth-config";

// Optimistic check only: it looks for the cookie, it doesn't verify it. Every protected
// layout verifies the signature itself before rendering anything.
export function proxy(request: NextRequest) {
  if (request.cookies.has("revokr_session")) return NextResponse.next();

  const login = new URL("/login", siteOrigin(request));
  login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/incidents/:path*",
    "/repositories/:path*",
    "/audit/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/states/:path*",
  ],
};
