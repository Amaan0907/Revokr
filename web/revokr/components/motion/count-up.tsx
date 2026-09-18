"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  // Where the count starts. A start above the value counts down, e.g. to a satisfying zero.
  from?: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

// Rolls a number to its value the first time it scrolls into view. Screen readers get the final
// value straight away; the moving digits are hidden from them.
export function CountUp({ value, from = 0, duration = 1.4, decimals = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, value, {
      duration: reduceMotion ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        if (digitsRef.current) digitsRef.current.textContent = latest.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, from, value, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      <span ref={digitsRef} aria-hidden>
        {from.toFixed(decimals)}
      </span>
      <span className="sr-only">{value.toFixed(decimals)}</span>
    </span>
  );
}
