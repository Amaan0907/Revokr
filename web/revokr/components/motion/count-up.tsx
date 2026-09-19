"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  // Where the count starts. A start above the value counts down, e.g. to a satisfying zero.
  from?: number;
  duration?: number;
  decimals?: number;
  // A cubic-bezier easing curve. The default settles almost at once; a gentler one keeps small
  // numbers visibly counting through each value. Pass a stable reference: it is an effect dependency.
  ease?: readonly [number, number, number, number];
  className?: string;
}

const DEFAULT_EASE = [0.16, 1, 0.3, 1] as const;

// Rolls a number to its value the first time it scrolls into view. Screen readers get the final
// value straight away; the moving digits are hidden from them.
export function CountUp({
  value,
  from = 0,
  duration = 1.4,
  decimals = 0,
  ease = DEFAULT_EASE,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  // Trim only the bottom edge: a number hugging the left edge of the page (like the first landing
  // stat) sits inside a 40px side margin and would never count as visible.
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, value, {
      duration: reduceMotion ? 0 : duration,
      ease: [...ease],
      onUpdate: (latest) => {
        if (digitsRef.current) digitsRef.current.textContent = latest.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, from, value, duration, decimals, ease]);

  return (
    <span ref={ref} className={className}>
      <span ref={digitsRef} aria-hidden>
        {from.toFixed(decimals)}
      </span>
      <span className="sr-only">{value.toFixed(decimals)}</span>
    </span>
  );
}
