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
      eyebrow="Get started"
      title="Create your"
      accent="Revokr account."
      description="Setup takes about a minute. Your repositories connect through GitHub."
      next={next}
      error={typeof params.error === "string" ? params.error : undefined}
      githubEnabled={isGitHubLoginEnabled()}
      googleEnabled={isGoogleLoginEnabled()}
      action="Sign up"
      switchPrompt="Already have an account?"
      switchHref="/login"
      switchLabel="Sign in"
      aside={
        <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-center gap-4 px-4 py-3.5">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-[-0.015em]">{step.title}</p>
                <p className="text-[13px] text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      }
    />
  );
}
