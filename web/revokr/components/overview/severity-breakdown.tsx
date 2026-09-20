import { Card, CardHeader } from "@/components/ds/primitives";
import { SEVERITY_META, SEVERITY_ORDER } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

// One segmented bar of what's open, with a count per severity underneath.
export function SeverityBreakdown({ incidents }: { incidents: Incident[] }) {
  const total = incidents.length;
  const rows = SEVERITY_ORDER.map((severity) => ({
    severity,
    meta: SEVERITY_META[severity],
    count: incidents.filter((incident) => incident.severity === severity).length,
  }));

  return (
    <Card as="section" aria-labelledby="severity-heading" className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardHeader id="severity-heading" title="Open by severity" />
        <span className="font-mono text-[11px] text-muted-foreground">{total} open</span>
      </div>

      <div aria-hidden className="flex h-2 gap-[3px] overflow-hidden rounded-full bg-white/6">
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <span key={row.severity} className={cn("h-full basis-0", row.meta.fill)} style={{ flexGrow: row.count }} />
          ))}
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {rows.map(({ severity, meta, count }) => (
          <li key={severity} className="flex items-center gap-2.5 border-b border-white/6 pb-[7px] last:border-b-0 last:pb-0">
            <span aria-hidden className={cn("size-1.5 rounded-full bg-current", meta.text)} />
            <span className="text-[12px] text-muted-foreground">{meta.label}</span>
            <span className="ml-auto font-mono text-[11px]">{count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
