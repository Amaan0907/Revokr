import type { ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, FlaskConical, Lock } from "lucide-react";
import { DemoButton } from "./demo-button";
import { GitHubMark } from "@/components/icons/github-mark";
import { LogoMark } from "@/components/shell/logo";
import { buttonVariants } from "@/components/ui/button";
import { AUTH_ERRORS } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  title: string;
  description: string;
  next: string;
  error?: string;
  githubEnabled: boolean;
  githubLabel: string;
  switchPrompt: string;
  switchHref: string;
  switchLabel: string;
  children?: ReactNode;
}

const WIDE = "h-12 w-full text-[15px]";

export function AuthForm({
  title,
  description,
  next,
  error,
  githubEnabled,
  githubLabel,
  switchPrompt,
  switchHref,
  switchLabel,
  children,
}: AuthFormProps) {
  const errorMessage = error ? (AUTH_ERRORS[error] ?? "Something went wrong. Please try again.") : null;

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="relative animate-rise">
          <div aria-hidden className="glow-fill absolute inset-0 rounded-[22px] opacity-40 blur-2xl" />
          <LogoMark className="relative size-16 rounded-[18px]" />
        </div>
        <h1
          className="mt-7 animate-rise text-[32px] font-semibold leading-tight tracking-[-0.035em] text-balance"
          style={{ animationDelay: "80ms" }}
        >
          {title}
        </h1>
        <p
          className="mt-2 animate-rise text-[15px] leading-relaxed text-muted-foreground text-balance"
          style={{ animationDelay: "160ms" }}
        >
          {description}
        </p>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-7 flex items-start gap-2.5 rounded-2xl bg-failed/10 px-4 py-3 text-sm text-failed ring-1 ring-inset ring-failed/25 animate-in fade-in zoom-in-95 duration-300"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      <div className="mt-9 flex animate-rise flex-col gap-3" style={{ animationDelay: "240ms" }}>
        {githubEnabled ? (
          <a href={`/api/auth/github?next=${encodeURIComponent(next)}`} className={cn(buttonVariants({ size: "lg" }), WIDE)}>
            <GitHubMark className="size-[18px]" />
            {githubLabel}
          </a>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button type="button" disabled className={cn(buttonVariants({ size: "lg" }), WIDE)}>
              <GitHubMark className="size-[18px]" />
              {githubLabel}
            </button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              GitHub sign-in isn&apos;t set up on this deployment yet. The live demo works right away.
            </p>
          </div>
        )}

        <div className="my-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <DemoButton next={next} className={cn(buttonVariants({ variant: "secondary", size: "lg" }), WIDE)}>
          <FlaskConical aria-hidden className="size-[18px] text-simulation" />
          Explore the live demo
        </DemoButton>
      </div>

      {children}

      <p className="mt-9 text-center text-sm text-muted-foreground">
        {switchPrompt}{" "}
        <Link
          href={switchHref}
          className="rounded-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {switchLabel}
        </Link>
      </p>

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Signing in only shares your public GitHub profile. Repository access is granted separately,
          when you install the Revokr GitHub App.
        </span>
      </p>
    </div>
  );
}
