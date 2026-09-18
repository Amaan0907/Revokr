"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatDuration, formatTime } from "@/lib/format";
import { AUDIT_ACTION_META, auditLabel, auditTone } from "@/lib/incident-meta";
import type { AuditLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

// path and line are merged into one "File" row; isLive is already said by the entry's label.
const HIDDEN_KEYS = new Set(["isLive", "path", "line"]);
const MONO_KEYS = new Set(["newKey", "newAccessKeyId", "secret", "repository", "step"]);

interface MetadataItem {
  label: string;
  value: string;
  mono: boolean;
}

function humanize(key: string) {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function metadataItems(entry: AuditLogEntry): MetadataItem[] {
  const metadata = entry.metadata;
  if (!metadata) return [];

  const items: MetadataItem[] = [];
  if (typeof metadata.path === "string") {
    const line = typeof metadata.line === "number" ? `:${metadata.line}` : "";
    items.push({ label: "File", value: `${metadata.path}${line}`, mono: true });
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (HIDDEN_KEYS.has(key) || value === null || value === undefined) continue;
    items.push({
      label: humanize(key),
      value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
      mono: MONO_KEYS.has(key),
    });
  }
  return items;
}

export function ActivityTimeline() {
  const { auditLog } = useLiveIncident();
  const [initialCount] = useState(auditLog.length);

  const entries = [...auditLog].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const start = entries.length ? new Date(entries[0].timestamp).getTime() : 0;

  return (
    <section
      aria-labelledby="timeline-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:240ms] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="timeline-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
            Activity
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Every step Revokr and your team took, in order. Times are UTC.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          {entries.length} {entries.length === 1 ? "event" : "events"}
        </span>
      </div>

      <ol aria-live="polite" aria-relevant="additions" className="mt-6 flex flex-col">
        {entries.map((entry, i) => {
          const Icon = AUDIT_ACTION_META[entry.action].icon;
          const items = metadataItems(entry);
          const elapsed = new Date(entry.timestamp).getTime() - start;
          const fresh = i >= initialCount;
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8, scale: fresh ? 0.98 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: fresh ? 0 : i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {i < entries.length - 1 && (
                <span aria-hidden className="absolute bottom-0 left-4 top-9 w-px -translate-x-1/2 bg-white/[0.08]" />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.07] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
                  auditTone(entry),
                )}
              >
                <Icon aria-hidden className="size-4" />
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="text-[15px] font-medium">{auditLabel(entry)}</p>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    <time dateTime={entry.timestamp}>{formatTime(entry.timestamp)}</time>
                    {" · "}
                    {i === 0 ? "Start" : `T+${formatDuration(elapsed)}`}
                  </p>
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  by <span className="font-mono">{entry.actor}</span>
                </p>

                {items.length > 0 && (
                  <dl className="mt-2.5 flex flex-col gap-1.5 rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-xs ring-1 ring-inset ring-white/[0.05]">
                    {items.map((item) => (
                      <div key={item.label} className="flex gap-3">
                        <dt className="w-20 shrink-0 text-muted-foreground">{item.label}</dt>
                        <dd className={cn("min-w-0 break-words", item.mono && "font-mono")}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
