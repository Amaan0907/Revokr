import type { ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, Clock, Lock } from "lucide-react";
import { DemoButton } from "./demo-button";
import { GitHubMark } from "@/components/icons/github-mark";
import { GoogleMark } from "@/components/icons/google-mark";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";
import { AUTH_ERRORS } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  // The small mono label above the headline, as on the landing page's sections.
  eyebrow: string;
  // The headline is two tones, like the hero's "Leaked. Replaced. Secured.": the title in silver
  // and the accent in the dimmer grey.
  title: string;
  accent: string;
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
  // Shown under the headline on wide screens, and under the sign-in panel on narrow ones so the
  // buttons stay near the top.
  aside?: ReactNode;
}

const MONO_LABEL = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground";

// Each headline part rises in on its own beat, as in the hero.
const WORD = "animate-rise inline-block pb-[0.1em]";

// The slide-arrow button, stretched to the panel's width with its label centred in the space beside
// the arrow circle.
const WIDE = "w-full justify-center";

// A link that starts the provider's sign-in, or a disabled button when it isn't configured.
function ProviderButton({
  enabled,
  href,
  variant,
  children,
}: {
  enabled: boolean;
  href: string;
  variant: "solid" | "outline";
  children: ReactNode;
}) {
  const className = cn(hoverButtonVariants({ variant, size: "lg" }), WIDE);
  const content = <HoverButtonContent>{children}</HoverButtonContent>;
  return enabled ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <button type="button" disabled className={className}>
      {content}
    </button>
  );
}

export function AuthForm({
  eyebrow,
  title,
  accent,
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
  aside,
}: AuthFormProps) {
  const errorMessage = error ? (AUTH_ERRORS[error] ?? "Something went wrong. Please try again.") : null;
  const unconfigured = [!githubEnabled && "GitHub", !googleEnabled && "Google"].filter(Boolean);
  const nextParam = encodeURIComponent(next);

  return (
    <div className="grid w-full items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,32rem)_28rem] lg:justify-center lg:gap-y-0">
      <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
        <p className={cn(MONO_LABEL, "animate-rise")}>{eyebrow}</p>
        <h1 className="mt-3 text-[length:clamp(2.4rem,4.4vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-balance">
          <span className={cn(WORD, "text-silver")} style={{ animationDelay: "80ms" }}>
            {title}
          </span>{" "}
          <span className={cn(WORD, "text-key")} style={{ animationDelay: "200ms" }}>
            {accent}
          </span>
        </h1>
        <p
          className="animate-lift mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground text-pretty"
          style={{ animationDelay: "320ms" }}
        >
          {description}
        </p>
      </div>

      <div
        className="animate-lift w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0b0c]/85 p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_30px_80px_-30px_rgb(0_0_0/0.9)] sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
        style={{ animationDelay: "260ms" }}
      >
        {notice && !errorMessage && (
          <div
            role="status"
            className="mb-6 flex items-start gap-2.5 rounded-xl border border-approval/25 bg-approval/10 px-4 py-3 text-sm animate-in fade-in zoom-in-95 duration-300"
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
            className="mb-6 flex items-start gap-2.5 rounded-xl border border-failed/25 bg-failed/10 px-4 py-3 text-sm text-failed animate-in fade-in zoom-in-95 duration-300"
          >
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <ProviderButton enabled={githubEnabled} href={`/api/auth/github?next=${nextParam}`} variant="solid">
            <GitHubMark className="size-[18px]" />
            {action} with GitHub
          </ProviderButton>

          <ProviderButton enabled={googleEnabled} href={`/api/auth/google?next=${nextParam}`} variant="outline">
            <GoogleMark className="size-[18px]" />
            {action} with Google
          </ProviderButton>

          {unconfigured.length > 0 && (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {unconfigured.join(" and ")} sign-in {unconfigured.length > 1 ? "aren't" : "isn't"} set up
              on this deployment yet. The live demo works right away.
            </p>
          )}

          <div className={cn(MONO_LABEL, "my-2 flex items-center gap-4")}>
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <DemoButton next={next} className={cn(hoverButtonVariants({ variant: "outline", size: "lg" }), WIDE)}>
            <HoverButtonContent>Explore the live demo</HoverButtonContent>
          </DemoButton>
        </div>

        <div className="mt-8 border-t border-white/[0.08] pt-6">
          <p className="text-center text-sm text-muted-foreground">
            {switchPrompt}{" "}
            <Link
              href={switchHref}
              className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {switchLabel}
            </Link>
          </p>

          <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Signing in only shares your name, email address and profile picture. Repository access is
              granted separately, when you install the Revokr GitHub App. Raw secrets are never stored,
              logged or shown.
            </span>
          </p>
        </div>
      </div>

      {aside && (
        <div
          className="animate-lift max-w-lg lg:col-start-1 lg:row-start-2 lg:mt-8 lg:self-start"
          style={{ animationDelay: "420ms" }}
        >
          {aside}
        </div>
      )}
    </div>
  );
}
