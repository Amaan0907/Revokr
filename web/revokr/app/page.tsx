import { SeverityBadge, StatusBadge } from "@/components/incidents/badges";
import { SEVERITY_ORDER, STATUS_META } from "@/lib/incident-meta";
import type { IncidentStatus } from "@/lib/types";

// Temporary preview; replaced by the Security Overview page.
export default function Home() {
  const statuses = Object.keys(STATUS_META) as IncidentStatus[];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Revokr badges</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Severity</h2>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_ORDER.map((severity) => (
            <SeverityBadge key={severity} severity={severity} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>
    </main>
  );
}
