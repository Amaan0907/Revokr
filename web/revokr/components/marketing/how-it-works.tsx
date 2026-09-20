"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";
import { cn } from "@/lib/utils";

type Tone = "ok" | "bad" | "warn";

interface Step {
  title: string;
  body: string;
  rows: { label: string; value: string; tone?: Tone }[];
}

const STEPS: Step[] = [
  {
    title: "Detect",
    body: "Scans every push to GitHub the moment it lands.",
    rows: [
      { label: "push", value: "main · 4e1a9c7" },
      { label: "file", value: "config/.env.production:4" },
      { label: "found", value: "AWS_ACCESS_KEY_ID=AKIA••••7QXM", tone: "bad" },
    ],
  },
  {
    title: "Validate",
    body: "Asks AWS whether the key still works, then scores the risk.",
    rows: [
      { label: "provider", value: "AWS" },
      { label: "status", value: "key is live", tone: "bad" },
      { label: "risk", value: "96 / 100" },
    ],
  },
  {
    title: "Approve",
    body: "Nothing changes until you say so. One click starts the rotation.",
    rows: [
      { label: "request", value: "rotate AKIA••••7QXM" },
      { label: "order", value: "replace first, revoke last" },
      { label: "status", value: "waiting for you", tone: "warn" },
    ],
  },
  {
    title: "Rotate",
    body: "A replacement is created and tested, then written to GitHub Actions.",
    rows: [
      { label: "create", value: "replacement key, tested", tone: "ok" },
      { label: "update", value: "GitHub Actions secret", tone: "ok" },
    ],
  },
  {
    title: "Verify",
    body: "Only then is the old key disabled and confirmed dead.",
    rows: [
      { label: "disable", value: "old key", tone: "ok" },
      { label: "verify", value: "old key rejected", tone: "ok" },
      { label: "result", value: "resolved in 14.6s", tone: "ok" },
    ],
  },
];

const TONE: Record<Tone, string> = {
  ok: "text-resolved",
  bad: "text-critical",
  warn: "text-approval",
};

const pad = (n: number) => String(n).padStart(2, "0");

// A stepper card: a row of numbered circles joined by lines, one step's detail below, and a
// Continue button that moves along. The circles are buttons too, so any step can be jumped to.
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const last = active === STEPS.length - 1;
  const step = STEPS[active];

  return (
    <section id="how-it-works" className="border-b border-white/[0.08] py-12">
      <div className="mx-auto w-[90vw]">
        <SectionHeading eyebrow="Workflow" title="Five steps. One click from you." />
      </div>

      <div className="mx-auto mt-10 w-[90vw] max-w-2xl rounded-3xl border border-white/10 bg-[#0b0b0c]/85 p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_30px_80px_-30px_rgb(0_0_0/0.9)] sm:p-8">
        <ol className="flex items-center">
          {STEPS.map((item, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={item.title} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Step ${i + 1}: ${item.title}`}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    current
                      ? "bg-foreground text-background ring-4 ring-white/15"
                      : done
                        ? "bg-white/20 text-foreground"
                        : "bg-white/[0.06] text-muted-foreground hover:bg-white/10",
                  )}
                >
                  {done ? (
                    <Check aria-hidden className="size-3.5" strokeWidth={3} />
                  ) : current ? (
                    <span aria-hidden className="size-2.5 rounded-full bg-background" />
                  ) : (
                    i + 1
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="relative mx-2 h-px flex-1 bg-white/10">
                    <span
                      className="absolute inset-y-0 left-0 bg-white/60 transition-[width] duration-500 ease-out"
                      style={{ width: done ? "100%" : "0%" }}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <p aria-live="polite" className="sr-only">
          Step {active + 1} of {STEPS.length}: {step.title}. {step.body}
        </p>

        {/* Every step sits in the same grid cell and only the current one is visible, so the card is
            always as tall as the tallest step and never resizes when you move between them. */}
        <div className="mt-8 grid">
          {STEPS.map((item, i) => (
            <div
              key={item.title}
              aria-hidden
              inert={i !== active}
              className={cn(
                "[grid-area:1/1] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              <p className="font-mono text-xs tabular-nums text-muted-foreground">{pad(i + 1)}</p>
              <h3 className="mt-1 text-[length:clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight tracking-[-0.04em] text-silver">
                {item.title}
              </h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
                {item.body}
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-[13px] leading-7 text-muted-foreground">
                {item.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
                    <span className="text-muted-foreground/70">{row.label}</span>
                    <span className={cn("truncate", row.tone ? TONE[row.tone] : "text-foreground")}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {active > 0 ? (
            <button
              type="button"
              onClick={() => setActive((i) => i - 1)}
              className="cursor-pointer rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setActive(last ? 0 : active + 1)}
            className={cn(hoverButtonVariants({ size: "default" }), "min-w-28")}
          >
            <HoverButtonContent>{last ? "Start over" : "Continue"}</HoverButtonContent>
          </button>
        </div>
      </div>
    </section>
  );
}
