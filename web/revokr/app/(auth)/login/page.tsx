import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
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
      title="Welcome back"
      description="Sign in to see what's leaked, and what's already been fixed."
      next={next}
      error={typeof params.error === "string" ? params.error : undefined}
      notice={
        params.reason === "expired"
          ? {
              title: "You were signed out.",
              body: "Your session ended. Any approval you were about to give was not submitted.",
            }
          : undefined
      }
      githubEnabled={isGitHubLoginEnabled()}
      googleEnabled={isGoogleLoginEnabled()}
      action="Continue"
      switchPrompt="New to Revokr?"
      switchHref="/signup"
      switchLabel="Create an account"
    />
  );
}
