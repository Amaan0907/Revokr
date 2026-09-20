import { Card, CardHeader, Eyebrow } from "@/components/ds/primitives";
import { STATUS_META } from "@/lib/incident-meta";
import type { Incident, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES: IncidentStatus[] = [
  "DETECTED",
  "VALIDATING",
  "AWAITING_APPROVAL",
  "ROTATING",
  "VERIFYING",
  "RESOLVED",
];

const EXITS: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION", "NOT_SUPPORTED"];

function StagePill({ status, count, index }: { status: IncidentStatus; count: number; index?: number }) {
  const meta = STATUS_META[status];
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-[12px] border px-[13px] py-[9px]",
        count > 0 ? "border-white/18" : "border-white/10",
      )}
    >
      {index !== undefined && <span className="font-mono text-[10px] text-muted-foreground">{index}</span>}
      <span className="text-[12px]">{meta.label}</span>
      <span className={cn("font-mono text-[11px] font-medium", count > 0 ? meta.text : "text-muted-foreground")}>
        {count}
      </span>
    </li>
  );
}

export function RemediationPipeline({ incidents }: { incidents: Incident[] }) {
  const countOf = (status: IncidentStatus) => incidents.filter((incident) => incident.status === status).length;

  return (
    <Card as="section" aria-labelledby="pipeline-heading" className="flex flex-col gap-3.5 p-5">
      <CardHeader
        id="pipeline-heading"
        title="Remediation pipeline"
        description="Where every incident is right now. A leaked key is only disabled after its replacement is verified."
      />
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {STAGES.map((status, i) => (
          <StagePill key={status} status={status} count={countOf(status)} index={i + 1} />
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        <Eyebrow className="tracking-[.14em]">stopped outside the pipeline</Eyebrow>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {EXITS.map((status) => (
            <StagePill key={status} status={status} count={countOf(status)} />
          ))}
        </ul>
      </div>
    </Card>
  );
}
