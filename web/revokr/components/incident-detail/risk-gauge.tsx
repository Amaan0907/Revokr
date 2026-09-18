import type { CSSProperties } from "react";
import { SEVERITY_META } from "@/lib/incident-meta";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-20", stroke: 10, score: "text-xl" },
  md: { box: "size-28", stroke: 10, score: "text-[28px]" },
} as const;

interface RiskGaugeProps {
  score: number;
  severity: Severity;
  size?: keyof typeof SIZES;
  // Must be unique on the page when two gauges of the same severity could render, one of them hidden.
  gradientId?: string;
}

// An Activity-style ring: a dim track in the severity colour with a glowing gradient arc on top.
export function RiskGauge({ score, severity, size = "md", gradientId }: RiskGaugeProps) {
  const meta = SEVERITY_META[severity];
  const { box, stroke, score: scoreClass } = SIZES[size];
  const radius = 50 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);
  const id = gradientId ?? `risk-ring-${severity.toLowerCase()}-${size}`;

  return (
    <div
      role="img"
      aria-label={`Risk score ${score} out of 100`}
      className={cn("relative grid shrink-0 place-items-center", box, meta.text)}
    >
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={meta.ring[0]} />
            <stop offset="100%" stopColor={meta.ring[1]} />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-current opacity-20"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-draw"
          style={
            {
              "--gauge-length": String(circumference),
              filter: "drop-shadow(0 0 5px color-mix(in srgb, currentColor 50%, transparent))",
            } as CSSProperties
          }
        />
      </svg>
      <div aria-hidden className="text-center">
        <p className={cn("font-semibold leading-none tracking-tight tabular-nums text-foreground", scoreClass)}>
          {score}
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Risk
        </p>
      </div>
    </div>
  );
}
