import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isGitHubLoginEnabled, isGoogleLoginEnabled, safeNextPath } from "@/lib/auth-config";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create your account" };

const STEPS = [
  { title: "Sign up with GitHub or Google", body: "No new password to create or remember." },
  { title: "Install the Revokr app", body: "Pick the repositories Revokr should watch." },
  { title: "Approve rotations", body: "Get alerted on leaks and fix them in one click." },
];

interface SignupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  if (await getSession()) redirect(next);

  return (
    <AuthForm
      title="Create your Revokr account"
      description="Setup takes about a minute. Your repositories connect through GitHub."
      next={next}
      error={typeof params.error === "string" ? params.error : undefined}
      githubEnabled={isGitHubLoginEnabled()}
      googleEnabled={isGoogleLoginEnabled()}
      action="Sign up"
      switchPrompt="Already have an account?"
      switchHref="/login"
      switchLabel="Sign in"
    >
      <ol
        className="mt-9 animate-rise divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.07]"
        style={{ animationDelay: "320ms" }}
      >
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3.5 px-4 py-3.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-link/15 text-[13px] font-semibold tabular-nums text-link">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </AuthForm>
  );
}
