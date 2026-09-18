"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Templates remount on every navigation, so each dashboard page eases in as you move between them.
// Opacity and transform only, which the GPU animates without repainting the page.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
