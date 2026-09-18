import type { CSSProperties } from "react";
import { SEVERITY_META } from "@/lib/incident-meta";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskGauge({ score, severity }: { score: number; severity: Severity }) {
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(score, 0), 100) / 100);

  return (
    <div
      role="img"
      aria-label={`Risk score ${score} out of 100`}
      className="relative grid size-24 shrink-0 place-items-center"
    >
      <svg aria-hidden viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn("animate-draw stroke-current", SEVERITY_META[severity].text)}
          style={{ "--gauge-length": String(CIRCUMFERENCE) } as CSSProperties}
        />
      </svg>
      <div aria-hidden className="text-center">
        <p className="text-2xl font-semibold leading-none tabular-nums">{score}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Risk</p>
      </div>
    </div>
  );
}
