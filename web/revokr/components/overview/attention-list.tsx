import Link from "next/link";
import { btn, Card, MonoStatus } from "@/components/ds/primitives";
import { timeAgo } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import type { Incident, IncidentStatus } from "@/lib/types";

const PRIORITY: Partial<Record<IncidentStatus, number>> = {
  AWAITING_APPROVAL: 0,
  FAILED: 1,
  REQUIRES_USER_ACTION: 2,
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
    <Card as="section" aria-labelledby="attention-heading" className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-[18px] py-4">
        <div className="flex flex-col gap-1">
          <h2 id="attention-heading" className="m-0 text-[14px] font-medium">
            Needs your attention
          </h2>
          <span className="text-[12px] text-muted-foreground">Incidents Revokr can&apos;t finish without a person.</span>
        </div>
        {sorted.length > 0 && <span className="font-mono text-[11px] text-critical">{sorted.length}</span>}
      </div>

      {sorted.length === 0 ? (
        <p className="m-0 px-[18px] py-6 text-[12px] leading-[1.6] text-muted-foreground">
          Nothing needs you right now. Revokr is handling every open incident on its own.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {sorted.map((incident) => {
            const primary = incident.status === "AWAITING_APPROVAL";
            return (
              <li key={incident.id} className="border-b border-white/6 last:border-b-0">
                <Link
                  href={`/incidents/${incident.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-[18px] py-3 transition-colors hover:bg-white/3"
                >
                  <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                    <span className="text-[13px]">{incident.secretType}</span>
                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {incident.repositoryOwner}/{incident.repositoryName} · {incident.filePath}
                      {incident.lineNumber !== null && `:${incident.lineNumber}`} · {timeAgo(incident.createdAt)}
                    </span>
                  </div>
                  <MonoStatus className={STATUS_META[incident.status].text}>
                    {incident.status.replaceAll("_", " ")}
                  </MonoStatus>
                  <span className={btn({ variant: primary ? "primary" : "secondary", size: "sm" })}>
                    {CTA[incident.status] ?? "Open"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
