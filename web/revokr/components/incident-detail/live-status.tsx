"use client";

import { AnimatePresence, motion } from "framer-motion";
import { StatusBadge } from "@/components/incidents/badges";
import { MOTION_CLASS, STATUS_META } from "@/lib/incident-meta";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

export function LiveStatusBadge() {
  const { status } = useLiveIncident();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.18 }}
        className="inline-flex"
      >
        <StatusBadge status={status} />
      </motion.span>
    </AnimatePresence>
  );
}

export function LiveStatusCallout() {
  const { status } = useLiveIncident();
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm ring-1 ring-inset transition-colors duration-500",
        meta.bg,
        meta.text,
        "ring-current/20",
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", meta.motion && MOTION_CLASS[meta.motion])}
      />
      <p>
        <span className="font-semibold">{meta.label}.</span>{" "}
        <span className="text-foreground/80">{meta.description}</span>
      </p>
    </div>
  );
}
