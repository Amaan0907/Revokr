import { Fragment, type ReactNode } from "react";
import { formatDateTime } from "@/lib/format";
import { PROVIDER_LABEL } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";

function liveLabel(isLive: boolean | null): ReactNode {
  if (isLive === null) return <span className="text-muted-foreground">Not checked yet</span>;
  return isLive ? <span className="text-critical">Yes</span> : "No";
}

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
    ["Fingerprint", <span key="fingerprint" className="font-mono">{incident.fingerprint}</span>],
    ["Live when detected", liveLabel(incident.isLive)],
    ["Detected", formatDateTime(incident.createdAt)],
  ];
  if (incident.resolvedAt) rows.push(["Resolved", formatDateTime(incident.resolvedAt)]);

  return (
    <section aria-labelledby="details-heading" className="rounded-xl border bg-card p-5">
      <h2 id="details-heading" className="text-sm font-semibold">
        Details
      </h2>
      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
