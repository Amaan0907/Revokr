import { SeverityBars } from "@/components/incidents/badges";
import { SEVERITY_META, SEVERITY_ORDER } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeverityBreakdown({ incidents }: { incidents: Incident[] }) {
  const total = incidents.length;

  return (
    <section aria-labelledby="severity-heading" className="rounded-xl border bg-card p-5">
      <h2 id="severity-heading" className="text-sm font-semibold">
        Open by severity
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {total} open {total === 1 ? "incident" : "incidents"}
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {SEVERITY_ORDER.map((severity, i) => {
          const meta = SEVERITY_META[severity];
          const count = incidents.filter((incident) => incident.severity === severity).length;
          return (
            <li key={severity} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <SeverityBars level={meta.level} className={meta.text} />
                  {meta.label}
                </span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
              </div>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full origin-left animate-grow-x", meta.fill)}
                  style={{
                    transform: `scaleX(${total ? count / total : 0})`,
                    animationDelay: `${300 + i * 80}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
