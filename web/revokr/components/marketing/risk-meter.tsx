"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// A plain ease-out: the number is seen passing through the values on its way up.
const EASE = [0.33, 1, 0.68, 1] as const;

// A score out of 100 with a bar under it. The first time it scrolls into view, the number counts up
// from 0 and the bar fills along with it. Both come from one animation, so the bar's length is
// always exactly the number shown. The parent hides it from screen readers, as it's a picture of a
// score rather than content.
export function RiskMeter({ score, duration = 1.8 }: { score: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // Trim only the bottom edge, as <CountUp /> does, so a card already at the top still counts.
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, score, {
      duration: reduceMotion ? 0 : duration,
      ease: [...EASE],
      onUpdate: (latest) => {
        if (numberRef.current) numberRef.current.textContent = String(Math.round(latest));
        if (barRef.current) barRef.current.style.width = `${latest}%`;
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, score, duration]);

  return (
    <div ref={ref}>
      <p className="text-4xl font-semibold leading-none tracking-[-0.05em] tabular-nums text-silver">
        <span ref={numberRef}>0</span>
        <span className="ml-1 text-base font-normal tracking-normal text-muted-foreground">/100</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-white/[0.08]">
        <div ref={barRef} className="h-full w-0 rounded-full bg-white/70" />
      </div>
    </div>
  );
}
