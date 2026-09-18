"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Apple's hero hand-off: as you scroll past, the block drifts up, shrinks a touch and fades,
// making way for what comes next. Only the fade is kept for people who prefer reduced motion.
export function ScrollFade({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -70]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 0.95]);

  return (
    <motion.div ref={ref} style={{ opacity, y, scale }} className={className}>
      {children}
    </motion.div>
  );
}
