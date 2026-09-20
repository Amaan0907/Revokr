import { NextResponse, type NextRequest } from "next/server";
import { apiConfigured, apiFetch } from "@/lib/api";
import { isSameOrigin, siteOrigin } from "@/lib/auth-config";
import { getSession, SESSION_COOKIE } from "@/lib/session";

// Deletes the signed-in account's stored data, then signs the person out. The confirmation is checked
// here, not only in the dialog, because a form post can be sent without the dialog.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const origin = siteOrigin(request);
  const back = (error: string) => NextResponse.redirect(new URL(`/settings?error=${error}`, origin), 303);

  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login?reason=expired", origin), 303);
  // The demo session is shared by everyone who tries the demo, so it has no account to delete.
  if (session.mode === "demo") return back("delete_demo");

  const typed = (await request.formData()).get("confirm")?.toString().trim().toLowerCase();
  if (typed !== session.user.login.toLowerCase()) return back("delete_confirm");

  // Only a GitHub sign-in has anything stored. A Google sign-in is just signed out. If the dashboard has
  // no API configured there is nothing stored anywhere either.
  if (session.mode === "github" && apiConfigured()) {
    try {
      await apiFetch<unknown>(`/api/account?github_user_id=${encodeURIComponent(session.user.id)}`, {
        method: "DELETE",
      });
    } catch {
      // Stay signed in, so the person can try again. Nothing was deleted: the API does it in one transaction.
      return back("delete_failed");
    }
  }

  const response = NextResponse.redirect(new URL("/login?reason=deleted", origin), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  return response;
}
