"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { SEVERITY_META } from "@/lib/incident-meta";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-20", stroke: 10, score: "text-xl" },
  md: { box: "size-28", stroke: 10, score: "text-[28px]" },
} as const;

// A plain ease-out: the number is seen passing through the values on its way up.
const EASE = [0.33, 1, 0.68, 1] as const;
const DURATION = 1.8;

interface RiskGaugeProps {
  score: number;
  severity: Severity;
  size?: keyof typeof SIZES;
  // Must be unique on the page when two gauges of the same severity could render, one of them hidden.
  gradientId?: string;
}

// An Activity-style ring: a dim track in the severity colour with a gradient arc on top. The first
// time it scrolls into view, the arc sweeps round and the number counts up with it. Both come from
// one animation, so the arc always matches the number shown.
export function RiskGauge({ score, severity, size = "md", gradientId }: RiskGaugeProps) {
  const meta = SEVERITY_META[severity];
  const { box, stroke, score: scoreClass } = SIZES[size];
  const radius = 50 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const id = gradientId ?? `risk-ring-${severity.toLowerCase()}-${size}`;

  const ref = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const numberRef = useRef<HTMLParagraphElement>(null);
  // Trim only the bottom edge, as <CountUp /> does, so a gauge already near the top still counts.
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const target = Math.min(Math.max(score, 0), 100);
    const controls = animate(0, target, {
      duration: reduceMotion ? 0 : DURATION,
      ease: [...EASE],
      onUpdate: (latest) => {
        if (numberRef.current) numberRef.current.textContent = String(Math.round(latest));
        if (arcRef.current) {
          arcRef.current.style.strokeDashoffset = String(circumference * (1 - latest / 100));
        }
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, score, circumference]);

  return (
    <div
      ref={ref}
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
          ref={arcRef}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div aria-hidden className="text-center">
        <p
          ref={numberRef}
          className={cn("font-semibold leading-none tracking-tight tabular-nums text-foreground", scoreClass)}
        >
          0
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Risk
        </p>
      </div>
    </div>
  );
}
