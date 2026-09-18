import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, EyeOff, FlaskConical, Lock, LockKeyhole, Sparkles } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { DemoButton } from "@/components/auth/demo-button";
import { GitHubMark } from "@/components/icons/github-mark";
import { CountUp } from "@/components/motion/count-up";
import { WipeIn } from "@/components/motion/wipe-in";
import { IconTile, type TileColor } from "@/components/shell/icon-tile";
import { Logo, LogoMark } from "@/components/shell/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DETECTS = ["AWS", "GitHub", "OpenAI", "Stripe", "Slack", "Google Cloud"];

export function ProviderStrip() {
  return (
    <section aria-label="Supported providers" className="mx-auto max-w-6xl px-4 sm:px-6">
      <Reveal className="flex flex-col items-center gap-6 border-y border-white/[0.06] py-10 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">Detects leaked keys from</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {DETECTS.map((provider) => (
            <li
              key={provider}
              className="text-xl font-semibold tracking-[-0.025em] text-foreground/40 transition-colors duration-300 hover:text-foreground"
            >
              {provider}
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-muted-foreground">
          and rotates <span className="text-foreground">AWS IAM keys</span> and{" "}
          <span className="text-foreground">GitHub Actions secrets</span> for you.
        </p>
      </Reveal>
    </section>
  );
}

const FACTS: { value: number; from?: number; label: string; body: string }[] = [
  { value: 6, label: "providers detected", body: "AWS, GitHub, OpenAI, Stripe, Slack and Google Cloud keys." },
  { value: 5, label: "steps, fixed order", body: "The replacement comes first. The leaked key goes last." },
  { value: 1, label: "click to approve", body: "Nothing touches a live credential without a person." },
  { value: 0, from: 99, label: "raw secrets stored", body: "Only masked values and fingerprints, anywhere." },
];

export function Numbers() {
  return (
    <section
      aria-label="Revokr in numbers"
      className="border-y border-white/[0.07] bg-white/[0.02] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur-2xl"
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-14 px-4 py-24 sm:px-6 lg:grid-cols-4">
        {FACTS.map((fact, i) => (
          <li key={fact.label}>
            <Reveal delay={i * 0.08}>
              <p className="text-[length:clamp(3.5rem,7vw,5.5rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums text-silver">
                <CountUp value={fact.value} from={fact.from} />
              </p>
              <p className="mt-4 text-[17px] font-semibold tracking-[-0.015em]">{fact.label}</p>
              <p className="mt-1 max-w-60 text-[15px] leading-relaxed text-muted-foreground">{fact.body}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tile({
  title,
  body,
  children,
  delay = 0,
  glow = false,
  className,
}: {
  title: ReactNode;
  body: string;
  children?: ReactNode;
  delay?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <Reveal
      delay={delay}
      className={cn("surface relative flex flex-col overflow-hidden rounded-[28px] p-7 sm:p-9", className)}
    >
      {glow && (
        <>
          <div
            aria-hidden
            className="glow-fill pointer-events-none absolute -top-28 left-1/2 h-56 w-3/4 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          />
          <div
            aria-hidden
            className="glow-fill glow-ring pointer-events-none absolute inset-0 rounded-[inherit] opacity-60"
          />
        </>
      )}
      <div className="relative flex flex-1 flex-col">
        <h3 className="max-w-md text-[length:clamp(1.375rem,2.2vw,1.75rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-balance">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">{body}</p>
        {children && <div className="mt-8 flex flex-1 flex-col justify-end">{children}</div>}
      </div>
    </Reveal>
  );
}

const ORDER = ["Validate", "Approve", "Replace", "Update secret", "Disable old", "Verify"];

const RISK_SEGMENTS = [
  { label: "Live", points: 40, shade: "opacity-100" },
  { label: "Public", points: 25, shade: "opacity-75" },
  { label: "Prod access", points: 20, shade: "opacity-55" },
  { label: "Recent", points: 11, shade: "opacity-35" },
];

const AUDIT = [
  { at: "14:02:11", action: "detected", actor: "gitleaks" },
  { at: "14:02:12", action: "validated", actor: "aws-adapter" },
  { at: "14:02:12", action: "risk_scored", actor: "revokr" },
  { at: "14:02:21", action: "approved", actor: "you" },
  { at: "14:02:23", action: "key_created", actor: "aws-adapter" },
  { at: "14:02:24", action: "gh_secret_updated", actor: "github-adapter" },
  { at: "14:02:25", action: "old_key_disabled", actor: "aws-adapter" },
  { at: "14:02:26", action: "verified", actor: "verifier" },
];

const REPO_SECRETS = [
  { name: "AWS_ACCESS_KEY_ID", fresh: true },
  { name: "AWS_SECRET_ACCESS_KEY", fresh: true },
  { name: "NPM_TOKEN", fresh: false },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
      <SectionHeading
        eyebrow="Features"
        title={
          <>
            Built for the minutes <span className="text-muted-foreground">after a leak.</span>
          </>
        }
        description="Everything a team needs to go from alert to closed incident, without writing a runbook first."
      />

      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-6">
        <Tile
          className="md:col-span-2 lg:col-span-4"
          title={
            <>
              A safe rotation order. <span className="text-link">Enforced.</span>
            </>
          }
          body="Revokr never disables a leaked key until its replacement has been created, deployed and tested. If any step fails, the old key stays put and you're told why."
        >
          <ol aria-label="Rotation order" className="flex flex-wrap items-center gap-x-1.5 gap-y-2.5">
            {ORDER.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                <span
                  className="animate-chain rounded-full px-3.5 py-1.5 text-[13px] font-medium"
                  style={{ animationDelay: `${i}s` }}
                >
                  {step}
                </span>
                {i < ORDER.length - 1 && (
                  <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/50" />
                )}
              </li>
            ))}
          </ol>
        </Tile>

        <Tile
          className="lg:col-span-2"
          delay={0.08}
          title="Risk you can read."
          body="Every score is the sum of named factors. No black box."
        >
          <div aria-hidden>
            <p className="flex items-baseline gap-1.5">
              <span className="text-6xl font-semibold tracking-[-0.05em] text-critical tabular-nums">
                <CountUp value={96} />
              </span>
              <span className="text-[15px] text-muted-foreground">/ 100</span>
            </p>
            <WipeIn className="mt-4 flex h-2.5 gap-[3px] text-critical" delay={0.2}>
              {RISK_SEGMENTS.map((segment) => (
                <span
                  key={segment.label}
                  className={cn("h-full rounded-full bg-current", segment.shade)}
                  style={{ width: `${segment.points}%` }}
                />
              ))}
            </WipeIn>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {RISK_SEGMENTS.map((segment) => (
                <li key={segment.label}>
                  {segment.label} <span className="tabular-nums text-foreground">+{segment.points}</span>
                </li>
              ))}
            </ul>
          </div>
        </Tile>

        <Tile
          className="lg:col-span-3"
          glow
          title={
            <>
              An analyst that <span className="text-spectrum">never sees the secret.</span>
            </>
          }
          body="Amazon Bedrock explains what leaked, why it matters and what to do next, working from sanitized metadata only."
        >
          <div aria-hidden className="rounded-2xl bg-black/60 p-4 ring-1 ring-white/10">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-simulation" />
              Amazon Bedrock
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              A live AWS key with production access was pushed to a public repository three minutes
              ago. Approve the rotation now; the replacement is ready.
            </p>
            <p className="mt-3 text-xs text-shimmer">The secret was removed before the prompt was built.</p>
          </div>
        </Tile>

        <Tile
          className="lg:col-span-3"
          delay={0.08}
          title="Every step, on the record."
          body="Detections, approvals and each rotation step are logged with who did it and exactly when."
        >
          <div
            aria-hidden
            className="overflow-hidden rounded-2xl bg-black/60 py-3 font-mono text-xs leading-6 ring-1 ring-white/10 [mask-image:linear-gradient(to_bottom,black_65%,transparent)]"
          >
            {AUDIT.map((row) => (
              <div key={row.action} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 px-4">
                <span className="text-muted-foreground/70">{row.at}</span>
                <span className={cn("truncate", row.action === "verified" ? "text-resolved" : "text-foreground")}>
                  {row.action}
                </span>
                <span className="text-muted-foreground">{row.actor}</span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          className="lg:col-span-2"
          title="Straight into GitHub Actions."
          body="The new key is sealed with your repository's public key and written into Actions secrets."
        >
          <div aria-hidden className="overflow-hidden rounded-2xl bg-black/60 ring-1 ring-white/10">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-xs font-medium text-muted-foreground">
              Repository secrets
            </p>
            <ul className="divide-y divide-white/[0.06]">
              {REPO_SECRETS.map((secret) => (
                <li key={secret.name} className="flex items-center gap-2.5 px-4 py-2.5 text-xs">
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-mono">{secret.name}</span>
                  {secret.fresh ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-resolved">
                      <span className="size-1.5 rounded-full bg-resolved shadow-[0_0_6px_var(--resolved)]" />
                      Updated now
                    </span>
                  ) : (
                    <span className="shrink-0 text-muted-foreground">3 months ago</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Tile>

        <Tile
          className="lg:col-span-2"
          delay={0.08}
          title={
            <>
              Rehearse it. <span className="text-simulation">Risk nothing.</span>
            </>
          }
          body="Simulation mode plays the whole flow end to end without touching a real credential."
        >
          <div aria-hidden className="flex items-center gap-3 rounded-2xl bg-black/60 px-4 py-3 ring-1 ring-white/10">
            <IconTile icon={FlaskConical} color="purple" size="md" />
            <span className="flex-1 text-sm font-medium">Simulation mode</span>
            <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-resolved">
              <span className="absolute right-0.5 top-0.5 size-[27px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35)]" />
            </span>
          </div>
        </Tile>

        <Tile
          className="md:col-span-2 lg:col-span-2"
          delay={0.16}
          title="Your team hears it first."
          body="Every incident ends with a short summary posted to your security channel."
        >
          <div aria-hidden className="flex gap-3 rounded-2xl bg-black/60 p-3.5 text-left ring-1 ring-white/10">
            <LogoMark className="size-9 rounded-[10px]" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold">
                Revokr <span className="font-normal text-muted-foreground">· #security</span>
              </p>
              <p className="mt-0.5 leading-snug text-foreground/80">
                Rotated an AWS key in acme/payments-api. The leaked one is confirmed dead.
              </p>
            </div>
          </div>
        </Tile>
      </div>
    </section>
  );
}

const PROMISES: { icon: LucideIcon; color: TileColor; title: string; body: string }[] = [
  {
    icon: EyeOff,
    color: "indigo",
    title: "Raw secrets are never stored",
    body: "Only masked values and fingerprints reach the database, logs, notifications or this dashboard.",
  },
  {
    icon: LockKeyhole,
    color: "blue",
    title: "Least-privilege by design",
    body: "Rotation runs as a dedicated IAM identity capped by a permissions boundary. Never an admin.",
  },
  {
    icon: Lock,
    color: "green",
    title: "Encrypted at rest",
    body: "GitHub App keys and webhook secrets live in AWS Secrets Manager, encrypted with KMS.",
  },
  {
    icon: Sparkles,
    color: "purple",
    title: "Sanitized before AI",
    body: "Bedrock only sees a whitelisted view of each incident. The secret is dropped before the prompt is built.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative isolate border-t border-white/[0.07]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-96 max-w-4xl rounded-full bg-[radial-gradient(closest-side,rgb(94_92_230/0.22),transparent)]"
      />
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <SectionHeading
          eyebrow="Security"
          title={
            <>
              Built to handle secrets. <span className="text-muted-foreground">Never to keep them.</span>
            </>
          }
          description="Revokr is designed so the secret it's protecting you from is never written down in readable form, anywhere in the system."
        />
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {PROMISES.map((promise, i) => (
            <li key={promise.title}>
              <Reveal delay={i * 0.08} className="surface h-full rounded-[28px] p-7">
                <IconTile icon={promise.icon} color={promise.color} size="lg" />
                <h3 className="mt-6 text-[19px] font-semibold leading-snug tracking-[-0.02em]">
                  {promise.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{promise.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-32 text-center sm:px-6 sm:py-44">
      <div
        aria-hidden
        className="glow-fill pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-[min(56rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[110px]"
      />
      <Reveal>
        <h2 className="mx-auto max-w-4xl text-[length:clamp(2.5rem,7vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-balance">
          <span className="text-silver">Your next leak is already on its way.</span>{" "}
          <span className="text-spectrum">Be ready.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[length:clamp(1.0625rem,1.8vw,1.25rem)] leading-relaxed text-muted-foreground">
          Connect a repository in about a minute, or rehearse the whole flow in the live demo first.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          {signedIn ? (
            <Link href="/dashboard" className={buttonVariants({ size: "xl" })}>
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants({ size: "xl" })}>
                <GitHubMark className="size-[18px]" />
                Sign up with GitHub
              </Link>
              <DemoButton className="group inline-flex cursor-pointer items-center gap-1 rounded-sm text-[17px] text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Try the live demo
                <ChevronRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </DemoButton>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}

const FOOTER_LINKS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
    ],
  },
  {
    title: "Project",
    links: [{ label: "Source on GitHub", href: "https://github.com/Amaan0907/Revokr", external: true }],
  },
];

const FOOTER_LINK =
  "rounded-sm text-[13px] text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Leaked secrets, rotated safely. Built on AWS for teams that ship on GitHub.
            </p>
          </div>
          {FOOTER_LINKS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(FOOTER_LINK, "inline-flex items-center gap-1.5")}
                      >
                        <GitHubMark className="size-3.5" />
                        {link.label}
                      </a>
                    ) : link.href.startsWith("#") ? (
                      <a href={link.href} className={FOOTER_LINK}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={FOOTER_LINK}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>Copyright © {new Date().getFullYear()} Revokr. All rights reserved.</p>
          <p>Raw secrets are never stored, logged or shown.</p>
        </div>
      </div>
    </footer>
  );
}
