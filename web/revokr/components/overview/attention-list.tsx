import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SeverityBadge, StatusBadge } from "@/components/incidents/badges";
import { buttonVariants } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import type { Incident, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY: Partial<Record<IncidentStatus, number>> = {
  AWAITING_APPROVAL: 0,
  FAILED: 1,
  REQUIRES_USER_ACTION: 2,
};

const CTA: Partial<Record<IncidentStatus, string>> = {
  AWAITING_APPROVAL: "Review & approve",
  FAILED: "See what failed",
  REQUIRES_USER_ACTION: "See next steps",
};

export function AttentionList({ incidents }: { incidents: Incident[] }) {
  const sorted = [...incidents].sort(
    (a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || b.riskScore - a.riskScore,
  );

  return (
    <section aria-labelledby="attention-heading" className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 id="attention-heading" className="text-sm font-semibold">
            Needs your attention
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Incidents Revokr can&apos;t finish without a person.
          </p>
        </div>
        {sorted.length > 0 && (
          <span className="rounded-full bg-approval/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-approval">
            {sorted.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <ShieldCheck aria-hidden className="size-6 text-resolved" />
          <p className="text-sm font-medium">Nothing needs you right now</p>
          <p className="text-xs text-muted-foreground">
            Revokr is handling every open incident on its own.
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {sorted.map((incident, i) => (
            <li
              key={incident.id}
              style={{ animationDelay: `${240 + i * 60}ms` }}
              className="animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both"
            >
              <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/30 md:flex-row md:items-center md:gap-4">
                <SeverityBadge severity={incident.severity} className="w-24" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium">{incident.secretType}</p>
                    <code className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {incident.maskedValue}
                    </code>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {incident.repositoryOwner}/{incident.repositoryName}
                    {" · "}
                    <span className="font-mono">
                      {incident.filePath}
                      {incident.lineNumber !== null && `:${incident.lineNumber}`}
                    </span>
                    {" · "}
                    Risk <span className="tabular-nums text-foreground">{incident.riskScore}</span>
                    {" · "}
                    {timeAgo(incident.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={incident.status} />
                  <Link
                    href={`/incidents/${incident.id}`}
                    className={cn(
                      buttonVariants({
                        size: "sm",
                        variant: incident.status === "AWAITING_APPROVAL" ? "default" : "outline",
                      }),
                      "rounded-md",
                    )}
                  >
                    {CTA[incident.status] ?? "Open"}
                    <ArrowRight aria-hidden data-icon="inline-end" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
