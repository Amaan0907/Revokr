import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, FileKey, FlaskConical, Gauge, ListOrdered, ScrollText, Sparkles } from "lucide-react";
import { IconBox } from "./icon-box";
import { Reveal } from "./reveal";
import { RiskMeter } from "./risk-meter";
import { SectionHeading } from "./section-heading";
import { DemoButton } from "@/components/auth/demo-button";
import { GitHubMark } from "@/components/icons/github-mark";
import { AwsMark, GoogleCloudMark, OpenAiMark, SlackMark, StripeMark } from "@/components/icons/provider-marks";
import { CountUp } from "@/components/motion/count-up";
import { Logo } from "@/components/shell/logo";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";
import { cn } from "@/lib/utils";

// The page is a bordered column: sections are divided by hairlines, and grids draw their cell
// borders with a 1px gap over a line-coloured background, so neighbouring cells share one line.
const LINE = "border-white/[0.08]";
const GRID = "grid gap-px bg-white/[0.08]";
const CELL = "bg-black/60 p-5 sm:p-6";
const MONO_LABEL = "font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground";

// The AWS mark is a wide wordmark that would look tiny at the shared icon size, so it gets its own.
const DETECTS: { name: string; Mark: (props: SVGProps<SVGSVGElement>) => ReactNode; markClass?: string }[] = [
  { name: "AWS", Mark: AwsMark, markClass: "size-14" },
  { name: "GitHub", Mark: GitHubMark },
  { name: "OpenAI", Mark: OpenAiMark },
  { name: "Stripe", Mark: StripeMark },
  { name: "Slack", Mark: SlackMark },
  { name: "Google Cloud", Mark: GoogleCloudMark },
];

export function ProviderStrip() {
  return (
    <section aria-label="Supported providers" className={cn("border-b py-8", LINE)}>
      <div className="mx-auto w-[90vw]">
        <p className={MONO_LABEL}>Detects leaks from</p>
        <ul className={cn(GRID, "mt-4 grid-cols-2 overflow-hidden rounded-2xl border sm:grid-cols-3 lg:grid-cols-6", LINE)}>
          {DETECTS.map(({ name, Mark, markClass }) => (
            <li
              key={name}
              className="flex h-36 flex-col items-center justify-center gap-1 bg-black/60 text-[15px] font-semibold tracking-[-0.02em] text-foreground"
            >
              <span className="grid h-14 place-items-center">
                <Mark className={cn("size-9 shrink-0", markClass)} />
              </span>
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// A plain ease-out: slow enough that 0 to 6 is seen passing through 1, 2, 3.
const COUNT_EASE = [0.33, 1, 0.68, 1] as const;

// Every figure counts up from 0 to its value when it scrolls into view.
const FACTS: { value: number; label: string }[] = [
  { value: 6, label: "providers detected" },
  { value: 5, label: "steps, fixed order" },
  { value: 1, label: "click to approve" },
  { value: 0, label: "raw secrets stored" },
];

export function Numbers() {
  return (
    <section aria-label="Revokr in numbers" className={cn("border-b py-8", LINE)}>
      <ul className={cn(GRID, "mx-auto w-[90vw] grid-cols-2 overflow-hidden rounded-2xl border lg:grid-cols-4", LINE)}>
        {FACTS.map((fact) => (
          <li key={fact.label} className={CELL}>
            <p className="text-[length:clamp(1.75rem,3vw,2.25rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-silver">
              <CountUp value={fact.value} duration={2} ease={COUNT_EASE} />
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">{fact.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// A small terminal-style readout: the same monospace treatment for every snippet.
function Terminal({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-md border bg-white/[0.02] p-2.5 font-mono text-xs leading-5 text-muted-foreground",
        LINE,
      )}
    >
      {children}
    </div>
  );
}

const ROTATION: { done: boolean; step: string; note: string }[] = [
  { done: true, step: "validate", note: "AKIA…7QXM is live" },
  { done: true, step: "create", note: "replacement key tested" },
  { done: true, step: "update", note: "GitHub Actions secret" },
  { done: false, step: "disable", note: "old key, last" },
];

const AUDIT = [
  { at: "14:02:11", action: "detected" },
  { at: "14:02:21", action: "approved" },
  { at: "14:02:24", action: "gh_secret_updated" },
  { at: "14:02:26", action: "verified" },
];

interface BentoCard {
  icon: LucideIcon;
  title: string;
  body: string;
  // Grid placement only: the card fills whatever cell it is given.
  className?: string;
  visual: ReactNode;
}

// One row of a step list: a status dot, the step name, then a short note.
function RotationSteps() {
  return (
    <ol aria-hidden className="mt-auto divide-y divide-white/[0.06] pt-4 font-mono text-xs lg:text-[13px]">
      {ROTATION.map((row) => (
        <li key={row.step} className="flex items-center gap-3 py-3 lg:gap-4 lg:py-4">
          <span
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
              row.done
                ? "border-resolved/40 bg-resolved/10 text-resolved"
                : "border-white/15 text-muted-foreground/60",
            )}
          >
            {row.done ? "✓" : "○"}
          </span>
          <span className="w-16 shrink-0 text-foreground lg:w-20">{row.step}</span>
          <span className="truncate text-muted-foreground">{row.note}</span>
        </li>
      ))}
    </ol>
  );
}

const BENTO: BentoCard[] = [
  {
    icon: ListOrdered,
    title: "Safe rotation order",
    body: "Replacement first. Old key last.",
    className: "md:col-span-2 lg:row-span-2",
    visual: <RotationSteps />,
  },
  {
    icon: Gauge,
    title: "Risk scoring",
    body: "Every leak scored 0 to 100.",
    visual: (
      <div aria-hidden className="mt-auto pt-3">
        <RiskMeter score={96} />
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: "AI analyst",
    body: "Plain-English summary, no secrets sent.",
    visual: (
      <div aria-hidden className="mt-auto pt-3">
        <p
          className={cn(
            "rounded-md border bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground",
            LINE,
          )}
        >
          A live AWS key was pushed to a public repo. Rotate it now.
        </p>
      </div>
    ),
  },
  {
    icon: ScrollText,
    title: "Audit trail",
    body: "Every step logged, with who and when.",
    className: "md:col-span-2",
    visual: (
      <div aria-hidden className="mt-auto pt-3">
        <Terminal>
          {AUDIT.map((row) => (
            <div key={row.action} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3">
              <span className="text-muted-foreground/70">{row.at}</span>
              <span className={cn("truncate", row.action === "verified" ? "text-resolved" : "text-foreground")}>
                {row.action}
              </span>
            </div>
          ))}
        </Terminal>
      </div>
    ),
  },
  {
    icon: FileKey,
    title: "GitHub Actions sync",
    body: "New keys written straight to secrets.",
    className: "md:col-span-1 lg:col-span-2",
    visual: (
      <div aria-hidden className="mt-auto pt-3">
        <Terminal>
          <div className="truncate text-foreground">secrets.AWS_ACCESS_KEY_ID</div>
          <div className="truncate">
            ••••••••••••7QXM <span className="text-resolved">✓ updated</span>
          </div>
        </Terminal>
      </div>
    ),
  },
  {
    icon: FlaskConical,
    title: "Simulation mode",
    body: "Rehearse without touching real keys.",
    className: "md:col-span-1 lg:col-span-2",
    visual: (
      <div aria-hidden className="mt-auto flex items-center gap-3 pt-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pl-2.5 pr-3 text-xs text-foreground">
          <span className="size-1.5 rounded-full bg-resolved" />
          Simulation on
        </span>
        <span className="font-mono text-xs text-muted-foreground">0 keys changed</span>
      </div>
    ),
  },
];

// A bento grid: rounded cards of different sizes, so the eye lands on rotation first and the
// smaller ideas sit around it. Two columns on tablets, four on desktop.
//
// On desktop the section is exactly one screen tall: the heading takes what it needs and the
// three grid rows share the rest, so the whole grid is in view at once. Rows never get shorter
// than their content needs, so on a very short window the section grows instead of clipping.
export function Features() {
  return (
    <section id="features" className={cn("border-b lg:flex lg:min-h-dvh lg:flex-col", LINE)}>
      {/* The heading and the grid share one 90vw column, centred on the screen. */}
      <div className="mx-auto w-[90vw] pb-6 pt-12">
        <SectionHeading eyebrow="Capabilities" title="Everything after the alert." />
      </div>
      <ul className="mx-auto grid w-[90vw] gap-4 pb-12 md:grid-cols-2 lg:flex-1 lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(14.5rem,1fr))]">
        {BENTO.map((card, i) => (
          <li key={card.title} className={cn("min-w-0", card.className)}>
            <Reveal delay={(i % 3) * 0.08} y={20} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.04] sm:p-5">
                <div className="flex items-center gap-3">
                  <IconBox icon={card.icon} />
                  <h3 className="text-[15px] font-semibold tracking-[-0.015em]">{card.title}</h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{card.body}</p>
                {card.visual}
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className={cn("relative border-b", LINE)}>
      <Reveal className="mx-auto flex w-[90vw] max-w-6xl flex-col items-center py-20 text-center lg:py-28">
        <h2 className="text-balance text-[length:clamp(2.25rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-silver">
          Ready before the next leak.
        </h2>
        <p className="mt-5 text-[length:clamp(1rem,1.6vw,1.25rem)] text-muted-foreground">
          Connect a repository in about a minute.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <Link href="/dashboard" className={hoverButtonVariants({ size: "hero" })}>
              <HoverButtonContent>Open dashboard</HoverButtonContent>
            </Link>
          ) : (
            <>
              <Link href="/signup" className={hoverButtonVariants({ size: "hero" })}>
                <HoverButtonContent>
                  <GitHubMark className="size-5" />
                  Sign up with GitHub
                </HoverButtonContent>
              </Link>
              <DemoButton className={hoverButtonVariants({ variant: "outline", size: "hero" })}>
                <HoverButtonContent>Try the demo</HoverButtonContent>
              </DemoButton>
            </>
          )}
        </div>
      </Reveal>

      {/* Beside the headline, on the page's right margin. It sits outside <Reveal /> because that
          moves as it fades in, and a moving parent would carry the button with it. The hero carries
          the id "home"; the page's smooth scrolling glides to it, and without that it is an
          ordinary jump to the top. */}
      <a
        href="#home"
        aria-label="Back to top"
        title="Back to top"
        className={cn(
          hoverButtonVariants({ variant: "outline", size: "icon" }),
          "absolute bottom-6 right-[5vw] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2",
        )}
      >
        <HoverButtonContent>
          <ArrowUp aria-hidden className="size-[18px]" />
        </HoverButtonContent>
      </a>
    </section>
  );
}

const FOOTER_LINKS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Workflow", href: "#how-it-works" },
      { label: "Capabilities", href: "#features" },
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
    <footer className="relative isolate overflow-hidden py-10">
      {/* The page's own arc has faded by the time you reach here, so the footer draws its own,
          kept faint so the text on top stays readable. */}
      <div aria-hidden className="bg-mono-arc pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46rem] opacity-30" />
      <div className="mx-auto w-[90vw]">
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
        <div
          className={cn(
            "mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between",
            LINE,
          )}
        >
          <p>Copyright © {new Date().getFullYear()} Revokr. All rights reserved.</p>
          <p>Raw secrets are never stored, logged or shown.</p>
        </div>
      </div>
    </footer>
  );
}
