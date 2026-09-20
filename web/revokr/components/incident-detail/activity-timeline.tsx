"use client";

import { Card, CardHeader } from "@/components/ds/primitives";
import { formatDuration, formatTime } from "@/lib/format";
import { auditLabel, auditTone } from "@/lib/incident-meta";
import type { AuditLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

// path and line are merged into one "file" row; isLive is already said by the entry's label.
const HIDDEN_KEYS = new Set(["isLive", "path", "line"]);

// Real audit rows carry lists and nested objects (the secrets a rotation wrote, the scored risk
// factors), which String() would print as "[object Object]".
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object" && value !== null) {
    const { name, points } = value as { name?: unknown; points?: unknown };
    if (typeof name === "string" && typeof points === "number") return `${name} (+${points})`;
    return JSON.stringify(value);
  }
  return String(value);
}

function metadataLines(entry: AuditLogEntry): string[] {
  const metadata = entry.metadata;
  if (!metadata) return [];

  const lines: string[] = [];
  if (typeof metadata.path === "string") {
    const line = typeof metadata.line === "number" ? `:${metadata.line}` : "";
    lines.push(`file: ${metadata.path}${line}`);
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (HIDDEN_KEYS.has(key) || value === null || value === undefined) continue;
    lines.push(`${key}: ${formatValue(value)}`);
  }
  return lines;
}

// Every step in order, with how long after detection it happened.
export function ActivityTimeline() {
  const { auditLog } = useLiveIncident();

  const entries = [...auditLog].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const start = entries.length ? new Date(entries[0].timestamp).getTime() : 0;

  return (
    <Card as="section" aria-labelledby="timeline-heading" className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <CardHeader
          id="timeline-heading"
          title="Activity"
          description="Every step Revokr and your team took, in order. Times are UTC."
        />
        <span className="font-mono text-[11px] text-muted-foreground">
          {entries.length} {entries.length === 1 ? "event" : "events"}
        </span>
      </div>

      <ol aria-live="polite" aria-relevant="additions" className="m-0 flex list-none flex-col p-0">
        {entries.map((entry, i) => {
          const lines = metadataLines(entry);
          const elapsed = new Date(entry.timestamp).getTime() - start;
          return (
            <li key={entry.id} className="flex gap-3 border-b border-white/6 py-2.5 last:border-b-0">
              <span aria-hidden className={cn("mt-[5px] size-1.5 shrink-0 rounded-full bg-current", auditTone(entry))} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[13px]">{auditLabel(entry)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    <time dateTime={entry.timestamp}>{formatTime(entry.timestamp)}Z</time>
                    {" · "}
                    {i === 0 ? "start" : `T+${formatDuration(elapsed)}`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">by {entry.actor}</span>
                {lines.length > 0 && (
                  <div className="mt-1 font-mono text-[11px] leading-[1.7] text-muted-foreground">
                    {lines.map((line) => (
                      <div key={line} className="break-all">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
