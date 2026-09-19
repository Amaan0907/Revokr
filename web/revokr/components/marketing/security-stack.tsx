"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

type Tone = "ok" | "bad" | "warn";

interface Point {
  title: string;
  // The short line on the card itself (small screens) and the longer one beside the stack.
  body: string;
  detail: string;
  rows: { label: string; value: string; tone?: Tone }[];
}

const PROMISES: Point[] = [
  {
    title: "No raw secrets stored",
    body: "Masked values and fingerprints only.",
    detail: "Only masked values and fingerprints reach the database, the logs and every notification.",
    rows: [
      { label: "stored", value: "AKIA••••7QXM", tone: "ok" },
      { label: "fingerprint", value: "sha256:9f2c…e41a", tone: "ok" },
      { label: "raw value", value: "never stored", tone: "ok" },
    ],
  },
  {
    title: "Least privilege",
    body: "A scoped IAM identity, never an admin.",
    detail: "Rotation runs as a dedicated IAM identity capped by a permissions boundary.",
    rows: [
      { label: "identity", value: "revokr-rotator" },
      { label: "boundary", value: "attached", tone: "ok" },
      { label: "admin access", value: "none", tone: "ok" },
    ],
  },
  {
    title: "Encrypted at rest",
    body: "AWS Secrets Manager with KMS.",
    detail: "GitHub App keys and webhook secrets live in AWS Secrets Manager, encrypted with KMS.",
    rows: [
      { label: "store", value: "AWS Secrets Manager" },
      { label: "encryption", value: "KMS", tone: "ok" },
      { label: "plaintext", value: "none on disk", tone: "ok" },
    ],
  },
  {
    title: "Sanitized before AI",
    body: "Bedrock never sees the key.",
    detail: "Bedrock only sees a whitelisted view of each incident. The secret is dropped before the prompt is built.",
    rows: [
      { label: "model", value: "Amazon Bedrock" },
      { label: "sent", value: "type, provider, severity" },
      { label: "secret", value: "removed first", tone: "ok" },
    ],
  },
];

const TONE: Record<Tone, string> = {
  ok: "text-resolved",
  bad: "text-critical",
  warn: "text-approval",
};

// Vertical distance, in px, that each card in the stack sits below the one under it.
const STACK_STEP = 14;

const pad = (n: number) => String(n).padStart(2, "0");

// Cards stack on the right as you scroll; the text on the left follows whichever card is on top.
// Below the lg breakpoint there is no pinning: just a heading and a plain list of cards.
export function SecuritySection() {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (!desktop.matches) return;
      // A card counts as current once its top edge has risen past this line.
      const line = window.innerHeight * 0.62;
      let next = 0;
      cardRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) next = i;
      });
      setActive(next);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const current = PROMISES[active];

  return (
    <section id="security" className="border-b border-white/[0.08]">
      <div className="px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div className="py-10 lg:py-0">
          <div className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center">
            <SectionHeading eyebrow="Security" title="Built to never keep a secret." />

            <div aria-live="polite" className="mt-12 hidden min-h-[13rem] lg:block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.08em] tabular-nums text-muted-foreground">
                    {pad(active + 1)} / {pad(PROMISES.length)}
                  </p>
                  <h3 className="mt-3 text-[length:clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-silver">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
                    {current.detail}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div aria-hidden className="mt-6 hidden gap-2 lg:flex">
              {PROMISES.map((promise, i) => (
                <span
                  key={promise.title}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === active ? "w-10 bg-foreground" : "w-5 bg-white/15",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <ol
          style={{ "--card-h": "min(24rem, 70dvh)" } as CSSProperties}
          className="grid gap-3 pb-10 lg:block lg:pb-24 lg:pt-[calc(50dvh-var(--card-h)/2)]"
        >
          {PROMISES.map((promise, i) => (
            <li
              key={promise.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{ top: `calc(50dvh - var(--card-h) / 2 + ${i * STACK_STEP}px)` }}
              className="lg:sticky lg:mb-[24dvh] lg:last:mb-0"
            >
              {/* Opaque on purpose: later cards have to fully hide the ones beneath them. */}
              <article className="flex flex-col rounded-2xl border border-white/10 bg-[#0b0b0c] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_-12px_32px_-12px_rgb(0_0_0/0.8)] sm:p-6 lg:h-[var(--card-h)] lg:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[15px] font-semibold tracking-[-0.015em]">{promise.title}</h3>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{pad(i + 1)}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground lg:hidden">{promise.body}</p>

                <div
                  aria-hidden
                  className="mt-6 min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs leading-7 text-muted-foreground lg:my-auto lg:p-6 lg:text-[13px] lg:leading-9"
                >
                  {promise.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 lg:grid-cols-[7.5rem_minmax(0,1fr)]"
                    >
                      <span className="text-muted-foreground/70">{row.label}</span>
                      <span className={cn("truncate", row.tone ? TONE[row.tone] : "text-foreground")}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
