import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { POINTS } from "@/components/marketing/hero";
import { IconBox } from "@/components/marketing/icon-box";
import { isGitHubLoginEnabled, isGoogleLoginEnabled, safeNextPath } from "@/lib/auth-config";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  if (await getSession()) redirect(next);

  return (
    <AuthForm
      eyebrow="Sign in"
      title="Welcome"
      accent="back."
      description="Sign in to see what's leaked, and what's already been fixed."
      next={next}
      error={typeof params.error === "string" ? params.error : undefined}
      notice={
        params.reason === "expired"
          ? {
              title: "You were signed out.",
              body: "Your session ended. Any approval you were about to give was not submitted.",
            }
          : params.reason === "deleted"
            ? {
                title: "Your account was deleted.",
                body: "Your Revokr data was removed. To stop GitHub sending pushes to Revokr, uninstall the app at github.com/settings/installations.",
              }
            : undefined
      }
      githubEnabled={isGitHubLoginEnabled()}
      googleEnabled={isGoogleLoginEnabled()}
      action="Continue"
      switchPrompt="New to Revokr?"
      switchHref="/signup"
      switchLabel="Create an account"
      aside={
        <ul className="flex flex-col gap-4">
          {POINTS.map((point) => (
            <li key={point.title} className="flex items-center gap-3.5">
              <IconBox icon={point.icon} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-[-0.015em]">{point.title}</p>
                <p className="text-[13px] text-muted-foreground">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      }
    />
  );
}
