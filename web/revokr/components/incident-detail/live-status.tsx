"use client";

import { StatusBadge } from "@/components/incidents/badges";
import { MOTION_CLASS, STATUS_META } from "@/lib/incident-meta";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

export function LiveStatusBadge() {
  const { status } = useLiveIncident();
  return <StatusBadge status={status} />;
}

export function LiveStatusCallout() {
  const { status } = useLiveIncident();
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-500",
        meta.bg,
        meta.border,
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", meta.text, meta.motion && MOTION_CLASS[meta.motion])}
      />
      <p>
        <span className={cn("font-medium", meta.text)}>{meta.label}.</span>{" "}
        <span className="text-foreground/80">{meta.description}</span>
      </p>
    </div>
  );
}
