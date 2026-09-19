import type { ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, Clock, FlaskConical, Lock } from "lucide-react";
import { DemoButton } from "./demo-button";
import { GitHubMark } from "@/components/icons/github-mark";
import { GoogleMark } from "@/components/icons/google-mark";
import { LogoMark } from "@/components/shell/logo";
import { buttonVariants } from "@/components/ui/button";
import { AUTH_ERRORS } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  title: string;
  description: string;
  next: string;
  error?: string;
  // A calm heads-up rather than a failure, such as "you were signed out".
  notice?: { title: string; body: string };
  githubEnabled: boolean;
  googleEnabled: boolean;
  // Verb for the provider buttons: "Continue" on sign-in, "Sign up" on sign-up.
  action: string;
  switchPrompt: string;
  switchHref: string;
  switchLabel: string;
  children?: ReactNode;
}

const WIDE = "h-12 w-full text-[15px]";

// Google's dark-theme button colours: near-black fill, grey outline, light grey text.
const GOOGLE =
  "border-[#8e918f]/60 bg-[#131314] text-[#e3e3e3] hover:bg-[#1e1f20]";

// A link that starts the provider's sign-in, or a disabled button when it isn't configured.
function ProviderButton({
  enabled,
  href,
  className,
  children,
}: {
  enabled: boolean;
  href: string;
  className: string;
  children: ReactNode;
}) {
  return enabled ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <button type="button" disabled className={className}>
      {children}
    </button>
  );
}

export function AuthForm({
  title,
  description,
  next,
  error,
  notice,
  githubEnabled,
  googleEnabled,
  action,
  switchPrompt,
  switchHref,
  switchLabel,
  children,
}: AuthFormProps) {
  const errorMessage = error ? (AUTH_ERRORS[error] ?? "Something went wrong. Please try again.") : null;
  const unconfigured = [!githubEnabled && "GitHub", !googleEnabled && "Google"].filter(Boolean);
  const nextParam = encodeURIComponent(next);

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="animate-rise">
          <LogoMark className="size-14 rounded-[16px]" />
        </div>
        <h1
          className="mt-6 animate-rise text-[26px] font-semibold leading-tight tracking-[-0.035em] text-balance"
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

      {notice && !errorMessage && (
        <div
          role="status"
          className="mt-7 flex items-start gap-2.5 rounded-2xl bg-approval/10 px-4 py-3 text-sm ring-1 ring-inset ring-approval/25 animate-in fade-in zoom-in-95 duration-300"
        >
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-approval" />
          <p>
            <span className="font-semibold text-approval">{notice.title}</span>{" "}
            <span className="text-foreground/80">{notice.body}</span>
          </p>
        </div>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-7 flex items-start gap-2.5 rounded-2xl bg-failed/10 px-4 py-3 text-sm text-failed ring-1 ring-inset ring-failed/25 animate-in fade-in zoom-in-95 duration-300"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      <div className="mt-9 flex animate-lift flex-col gap-3" style={{ animationDelay: "240ms" }}>
        <ProviderButton
          enabled={githubEnabled}
          href={`/api/auth/github?next=${nextParam}`}
          className={cn(buttonVariants({ size: "lg" }), WIDE)}
        >
          <GitHubMark className="size-[18px]" />
          {action} with GitHub
        </ProviderButton>

        <ProviderButton
          enabled={googleEnabled}
          href={`/api/auth/google?next=${nextParam}`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), WIDE, GOOGLE)}
        >
          <GoogleMark className="size-[18px]" />
          {action} with Google
        </ProviderButton>

        {unconfigured.length > 0 && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {unconfigured.join(" and ")} sign-in {unconfigured.length > 1 ? "aren't" : "isn't"} set up
            on this deployment yet. The live demo works right away.
          </p>
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
          Signing in only shares your name, email address and profile picture. Repository access is
          granted separately, when you install the Revokr GitHub App.
        </span>
      </p>
    </div>
  );
}
