import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { SeverityBadge, StatusBadge } from "@/components/incidents/badges";
import { IconTile, type TileColor } from "@/components/shell/icon-tile";
import { buttonVariants } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import type { Incident, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY: Partial<Record<IncidentStatus, number>> = {
  AWAITING_APPROVAL: 0,
  FAILED: 1,
  REQUIRES_USER_ACTION: 2,
};

const TILE: Partial<Record<IncidentStatus, TileColor>> = {
  AWAITING_APPROVAL: "yellow",
  FAILED: "red",
  REQUIRES_USER_ACTION: "orange",
};

const CTA: Partial<Record<IncidentStatus, string>> = {
  AWAITING_APPROVAL: "Review",
  FAILED: "See what failed",
  REQUIRES_USER_ACTION: "Next steps",
};

export function AttentionList({ incidents }: { incidents: Incident[] }) {
  const sorted = [...incidents].sort(
    (a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || b.riskScore - a.riskScore,
  );

  return (
    <section
      aria-labelledby="attention-heading"
      className="surface overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:260ms]"
    >
      <div className="flex items-center justify-between gap-4 px-6 pb-3 pt-6">
        <div>
          <h2 id="attention-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
            Needs your attention
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Incidents Revokr can&apos;t finish without a person.
          </p>
        </div>
        {sorted.length > 0 && (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-critical px-2 text-xs font-semibold tabular-nums text-white">
            {sorted.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 pb-12 pt-8 text-center">
          <IconTile icon={ShieldCheck} color="green" size="lg" />
          <p className="text-[15px] font-medium">Nothing needs you right now</p>
          <p className="text-[13px] text-muted-foreground">
            Revokr is handling every open incident on its own.
          </p>
        </div>
      ) : (
        <ul className="pb-2">
          {sorted.map((incident, i) => {
            const meta = STATUS_META[incident.status];
            const primary = incident.status === "AWAITING_APPROVAL";
            return (
              <li
                key={incident.id}
                style={{ animationDelay: `${240 + i * 70}ms` }}
                className="relative animate-in fade-in slide-in-from-bottom-2 animation-duration-500 fill-mode-both after:absolute after:bottom-0 after:left-[4.75rem] after:right-6 after:h-px after:bg-white/[0.06] last:after:hidden"
              >
                <Link
                  href={`/incidents/${incident.id}`}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none"
                >
                  <IconTile icon={meta.icon} color={TILE[incident.status] ?? "gray"} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[15px] font-medium">{incident.secretType}</p>
                      <SeverityBadge severity={incident.severity} className="h-5 px-2 text-[11px]" />
                    </div>
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">
                      {incident.repositoryOwner}/{incident.repositoryName}
                      {" · "}
                      <span className="font-mono">
                        {incident.filePath}
                        {incident.lineNumber !== null && `:${incident.lineNumber}`}
                      </span>
                      {" · "}
                      {timeAgo(incident.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={incident.status} className="hidden md:inline-flex" />
                  <span
                    className={cn(
                      buttonVariants({ size: "sm", variant: primary ? "default" : "secondary" }),
                      "hidden sm:inline-flex",
                    )}
                  >
                    {CTA[incident.status] ?? "Open"}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 sm:hidden"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
