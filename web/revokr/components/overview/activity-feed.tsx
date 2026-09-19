import Link from "next/link";
import { Card, CardHeader } from "@/components/ds/primitives";
import { timeAgo } from "@/lib/format";
import { auditLabel, auditTone } from "@/lib/incident-meta";
import type { AuditLogEntry, Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  entry: AuditLogEntry;
  incident: Incident;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card as="section" aria-labelledby="activity-heading" className="flex flex-col gap-3 p-5">
      <CardHeader id="activity-heading" title="Recent activity" description="Latest events across every incident." />

      <ol className="m-0 flex list-none flex-col p-0">
        {items.map(({ entry, incident }) => (
          <li key={entry.id} className="flex gap-3 border-b border-white/6 py-2.5 last:border-b-0 last:pb-0">
            <span aria-hidden className={cn("mt-[5px] size-1.5 shrink-0 rounded-full bg-current", auditTone(entry))} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link href={`/incidents/${incident.id}`} className="text-[12px] hover:underline">
                {auditLabel(entry)}
              </Link>
              <span className="truncate text-[11px] text-muted-foreground">
                {incident.secretType} · {incident.repositoryName}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {entry.actor} · <time dateTime={entry.timestamp} suppressHydrationWarning>{timeAgo(entry.timestamp)}</time>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
