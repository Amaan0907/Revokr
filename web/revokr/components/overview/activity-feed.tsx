import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { AUDIT_ACTION_META, auditLabel, auditTone } from "@/lib/incident-meta";
import type { AuditLogEntry, Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  entry: AuditLogEntry;
  incident: Incident;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section
      aria-labelledby="activity-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:380ms]"
    >
      <h2 id="activity-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
        Recent activity
      </h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">Latest events across every incident.</p>

      <ol className="mt-5 flex flex-col">
        {items.map(({ entry, incident }, i) => {
          const Icon = AUDIT_ACTION_META[entry.action].icon;
          const isLast = i === items.length - 1;
          return (
            <li
              key={entry.id}
              style={{ animationDelay: `${400 + i * 50}ms` }}
              className="relative flex gap-3 pb-5 last:pb-0 animate-in fade-in slide-in-from-right-2 animation-duration-500 fill-mode-both"
            >
              {!isLast && (
                <span aria-hidden className="absolute bottom-0 left-4 top-9 w-px -translate-x-1/2 bg-white/[0.08]" />
              )}
              <span
                className={cn(
                  "relative grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06]",
                  auditTone(entry),
                )}
              >
                <Icon aria-hidden className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <Link
                  href={`/incidents/${incident.id}`}
                  className="rounded-sm text-sm font-medium underline-offset-4 transition-colors hover:text-link focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {auditLabel(entry)}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {incident.secretType} · {incident.repositoryName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  <span className="font-mono">{entry.actor}</span>
                  {" · "}
                  <time dateTime={entry.timestamp}>{timeAgo(entry.timestamp)}</time>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
