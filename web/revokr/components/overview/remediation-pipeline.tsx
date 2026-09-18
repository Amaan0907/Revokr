import { StatusBadge } from "@/components/incidents/badges";
import { MOTION_CLASS, STATUS_META } from "@/lib/incident-meta";
import type { Incident, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES: IncidentStatus[] = [
  "DETECTED",
  "VALIDATING",
  "AWAITING_APPROVAL",
  "ROTATING",
  "VERIFYING",
  "RESOLVED",
];

const EXITS: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION", "NOT_SUPPORTED"];

export function RemediationPipeline({ incidents }: { incidents: Incident[] }) {
  const countOf = (status: IncidentStatus) =>
    incidents.filter((incident) => incident.status === status).length;

  return (
    <section
      aria-labelledby="pipeline-heading"
      className="rounded-xl border bg-card p-5 animate-in fade-in duration-700 fill-mode-both [animation-delay:200ms]"
    >
      <h2 id="pipeline-heading" className="text-sm font-semibold">
        Remediation pipeline
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Where every incident is right now. A leaked key is only disabled after its replacement is
        verified.
      </p>

      <div className="relative mt-6">
        {/* Connector between the first and last stage centres (1/12 in from each side of a 6-column grid). */}
        <div aria-hidden className="absolute left-[8.333%] right-[8.333%] top-5 hidden h-px bg-border lg:block">
          <div className="absolute inset-0 animate-flow bg-linear-to-r from-transparent via-progress/80 to-transparent bg-[length:25%_100%] bg-no-repeat" />
        </div>

        <ol className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const count = countOf(status);
            const active = count > 0;
            return (
              <li key={status} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "relative grid size-10 place-items-center overflow-hidden rounded-full border bg-card",
                    active ? cn(meta.text, meta.border) : "text-muted-foreground",
                  )}
                >
                  {active && <span aria-hidden className={cn("absolute inset-0", meta.bg)} />}
                  <Icon
                    aria-hidden
                    className={cn("relative size-4", active && meta.motion && MOTION_CLASS[meta.motion])}
                  />
                </span>
                <span
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    !active && "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">{meta.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
        <span className="text-xs text-muted-foreground">Stopped outside the pipeline</span>
        {EXITS.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <StatusBadge status={status} />
            <span className="text-sm tabular-nums">{countOf(status)}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
