"use client";

import { motion, useScroll, useTransform } from "framer-motion";

// The landing page's background, fixed behind every section so the same gradient runs from the top
// of the page to the footer. The white arc is at full strength on the first screen, then settles to
// a faint glow as you scroll off it: left bright, it would sit under body text further down the
// page and make it unreadable.
export function PageGradient() {
  const { scrollY } = useScroll();
  const arcOpacity = useTransform(scrollY, (y) => {
    const screen = typeof window === "undefined" ? 800 : window.innerHeight;
    return 1 - 0.82 * Math.min(y / screen, 1);
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-black">
      <div className="bg-mono-base absolute inset-0" />
      <motion.div style={{ opacity: arcOpacity }} className="bg-mono-arc absolute inset-0" />
    </div>
  );
}
