"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Templates remount on every navigation, so each dashboard page settles in as you move between
// them. Movement only, no fade: a fading ancestor stops the glass cards inside from blurring
// what's behind them, and they'd visibly snap back once it finished. The cards fade themselves.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
