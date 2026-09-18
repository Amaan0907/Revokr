import { SeverityBars } from "@/components/incidents/badges";
import { WipeIn } from "@/components/motion/wipe-in";
import { SEVERITY_META, SEVERITY_ORDER } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

// One segmented bar, like the storage bar in iPhone Settings, with a legend underneath.
export function SeverityBreakdown({ incidents }: { incidents: Incident[] }) {
  const total = incidents.length;
  const rows = SEVERITY_ORDER.map((severity) => ({
    severity,
    meta: SEVERITY_META[severity],
    count: incidents.filter((incident) => incident.severity === severity).length,
  }));

  return (
    <section
      aria-labelledby="severity-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:320ms]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="severity-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
          Open by severity
        </h2>
        <span className="text-[13px] tabular-nums text-muted-foreground">
          {total} open
        </span>
      </div>

      <div aria-hidden className="mt-5 h-3 rounded-full bg-white/[0.06]">
        {total > 0 && (
          <WipeIn className="flex h-full gap-[3px]" delay={0.3}>
            {rows
              .filter((row) => row.count > 0)
              .map((row) => (
                <span
                  key={row.severity}
                  className={cn("h-full basis-0 rounded-full", row.meta.fill)}
                  style={{ flexGrow: row.count }}
                />
              ))}
          </WipeIn>
        )}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5">
        {rows.map(({ severity, meta, count }) => (
          <li key={severity} className="flex items-center gap-2.5 text-sm">
            <SeverityBars level={meta.level} className={meta.text} />
            <span className="font-medium">{meta.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
