"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Wipes its content in from the left the first time it scrolls into view. Suits segmented bars,
// which would look stretched if they were scaled instead.
export function WipeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0% 100% 0% 0% round 999px)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 999px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
