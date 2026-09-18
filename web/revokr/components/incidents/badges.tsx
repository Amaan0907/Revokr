import { FlaskConical } from "lucide-react";
import { MOTION_CLASS, SEVERITY_META, STATUS_META } from "@/lib/incident-meta";
import type { IncidentStatus, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

// Plain spans rather than the shadcn Badge, which uses a hook and so can't render on the server.
const BADGE_BASE =
  "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-medium";

const BAR_HEIGHTS = ["h-1", "h-1.5", "h-2", "h-2.5"];

export function SeverityBars({ level, className }: { level: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex h-2.5 items-end gap-px", className)}>
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={height}
          className={cn("w-[3px] rounded-[1px]", height, i < level ? "bg-current" : "bg-current/20")}
        />
      ))}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={cn(BADGE_BASE, meta.text, meta.bg, meta.border, className)}>
      <SeverityBars level={meta.level} />
      {meta.label}
    </span>
  );
}

export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      title="Created in simulation mode. No real credential is involved."
      className={cn(
        BADGE_BASE,
        "border-simulation/30 bg-simulation/10 font-mono text-[11px] uppercase tracking-wider text-simulation",
        className,
      )}
    >
      <FlaskConical aria-hidden className="size-3.5" />
      Simulated
    </span>
  );
}

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      title={meta.description}
      className={cn(BADGE_BASE, meta.text, meta.bg, meta.border, className)}
    >
      <Icon aria-hidden className={cn("size-3.5 shrink-0", meta.motion && MOTION_CLASS[meta.motion])} />
      {meta.label}
    </span>
  );
}
