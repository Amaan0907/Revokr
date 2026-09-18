import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/format";
import { PROVIDER_LABEL } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";

function liveLabel(isLive: boolean | null): ReactNode {
  if (isLive === null) return <span className="text-muted-foreground">Not checked yet</span>;
  return isLive ? <span className="font-medium text-critical">Yes</span> : "No";
}

// Laid out like an iOS "About" list: label on the left, value on the right, hairlines between.
export function IncidentDetails({ incident }: { incident: Incident }) {
  const rows: [string, ReactNode][] = [
    ["Provider", PROVIDER_LABEL[incident.provider]],
    ["Repository", `${incident.repositoryOwner}/${incident.repositoryName}`],
    [
      "File",
      <span key="file" className="font-mono break-all">
        {incident.filePath}
        {incident.lineNumber !== null && `:${incident.lineNumber}`}
      </span>,
    ],
    [
      "Commit",
      <span key="commit" className="font-mono" title={incident.commitSha}>
        {incident.commitSha.slice(0, 12)}
      </span>,
    ],
    ["Fingerprint", <span key="fingerprint" className="font-mono break-all">{incident.fingerprint}</span>],
    ["Live when detected", liveLabel(incident.isLive)],
    ["Detected", formatDateTime(incident.createdAt)],
  ];
  if (incident.resolvedAt) rows.push(["Resolved", formatDateTime(incident.resolvedAt)]);

  return (
    <section
      aria-labelledby="details-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:320ms]"
    >
      <h2 id="details-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
        Details
      </h2>
      <dl className="mt-3 flex flex-col divide-y divide-white/[0.06] text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-6 py-3 last:pb-0">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
