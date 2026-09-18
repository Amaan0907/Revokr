"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { RiskGauge } from "@/components/incident-detail/risk-gauge";
import { SeverityBadge, StatusBadge } from "@/components/incidents/badges";
import type { IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { label: string; at: string; status: IncidentStatus }[] = [
  { label: "Secret found in a push to main", at: "0.4s", status: "VALIDATING" },
  { label: "Confirmed live with AWS", at: "1.2s", status: "AWAITING_APPROVAL" },
  { label: "Rotation approved by you", at: "9.8s", status: "ROTATING" },
  { label: "Replacement key created and tested", at: "11.3s", status: "ROTATING" },
  { label: "GitHub Actions secret updated", at: "12.1s", status: "VERIFYING" },
  { label: "Leaked key disabled and confirmed dead", at: "14.6s", status: "RESOLVED" },
];

// A looping, self-playing incident: the product's whole promise in fifteen seconds.
export function HeroDemo({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const delay = done === STEPS.length ? 3600 : done === 0 ? 1000 : 1150;
    const timer = setTimeout(() => setDone((d) => (d === STEPS.length ? 0 : d + 1)), delay);
    return () => clearTimeout(timer);
  }, [done, reduceMotion]);

  const shown = reduceMotion ? STEPS.length : done;
  const status: IncidentStatus = shown === 0 ? "DETECTED" : STEPS[shown - 1].status;
  const resolved = shown === STEPS.length;

  return (
    <div
      role="img"
      aria-label="Example: Revokr detects a leaked AWS key, gets approval, rotates it and confirms the old key is dead in about 15 seconds."
      className={cn("flex min-w-0 flex-col", className)}
    >
      <div className="flex-1 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity="CRITICAL" />
              <StatusBadge status={status} />
            </div>
            <p className="mt-4 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">AWS access key</p>
            <code className="mt-2 inline-block rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-[13px]">
              AKIA••••••••••••7QXM
            </code>
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
              acme/payments-api · config/.env.production:4
            </p>
          </div>
          <RiskGauge score={96} severity="CRITICAL" size="sm" gradientId="hero-demo-ring" />
        </div>

        <ol className="mt-6 flex flex-col gap-0.5">
          {STEPS.map((step, i) => {
            const state = i < shown ? "done" : i === shown ? "active" : "todo";
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors duration-500",
                  state === "active" && "bg-progress/10",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full transition-all duration-500",
                    state === "done" && "bg-resolved text-black",
                    state === "active" && "text-progress",
                    state === "todo" && "ring-1 ring-inset ring-white/15",
                  )}
                >
                  {state === "done" && <Check className="size-3" strokeWidth={3.5} />}
                  {state === "active" && <LoaderCircle className="size-4 animate-spin" />}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate transition-colors duration-500",
                    state === "todo" ? "text-muted-foreground/70" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "ml-auto font-mono text-xs tabular-nums text-muted-foreground transition-opacity duration-500",
                    state === "done" ? "opacity-100" : "opacity-0",
                  )}
                >
                  {step.at}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative h-12 border-t border-white/[0.06]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={resolved ? "resolved" : "running"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute inset-0 flex items-center gap-2 px-5 text-left text-[13px] sm:px-7",
              resolved ? "bg-resolved/10 text-resolved" : "text-muted-foreground",
            )}
          >
            {resolved ? (
              <>
                <ShieldCheck className="size-4 shrink-0" />
                Resolved in 14.6 seconds, with one click from you.
              </>
            ) : (
              "The leaked key stays untouched until its replacement works."
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
