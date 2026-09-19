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
      className="surface rounded-3xl p-6 animate-in fade-in animation-duration-700 fill-mode-both [animation-delay:200ms] sm:p-7"
    >
      <h2 id="pipeline-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
        Remediation pipeline
      </h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        Where every incident is right now. A leaked key is only disabled after its replacement is
        verified.
      </p>

      <div className="relative mt-8">
        {/* Connector between the first and last stage centres (1/12 in from each side of a 6-column grid). */}
        <div aria-hidden className="absolute left-[8.333%] right-[8.333%] top-[22px] hidden h-px bg-white/10 lg:block">
          <div className="absolute inset-0 animate-flow bg-linear-to-r from-transparent via-link to-transparent bg-[length:22%_100%] bg-no-repeat" />
        </div>

        <ol className="relative grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((status, i) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const count = countOf(status);
            const active = count > 0;
            return (
              <li
                key={status}
                style={{ animationDelay: `${300 + i * 70}ms` }}
                className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 animation-duration-500 fill-mode-both"
              >
                <span
                  className={cn(
                    // Opaque so the connector line behind it doesn't show through.
                    "grid size-11 place-items-center rounded-full bg-[#0c0c0e] ring-1 ring-inset",
                    active ? cn(meta.text, "ring-current/40") : "text-muted-foreground/60 ring-white/10",
                  )}
                >
                  <span className={cn("grid size-full place-items-center rounded-full", active && meta.bg)}>
                    <Icon
                      aria-hidden
                      className={cn("size-[18px]", active && meta.motion && MOTION_CLASS[meta.motion])}
                    />
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-3 text-[24px] font-semibold leading-none tracking-[-0.03em] tabular-nums",
                    !active && "text-muted-foreground/50",
                  )}
                >
                  {count}
                </span>
                <span className="mt-1.5 text-xs text-muted-foreground">{meta.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-5">
        <span className="text-[13px] text-muted-foreground">Stopped outside the pipeline</span>
        {EXITS.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <StatusBadge status={status} />
            <span className="text-sm font-medium tabular-nums">{countOf(status)}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
