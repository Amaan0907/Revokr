import Link from "next/link";
import { Card, Cell, MonoStatus, StatusCell, TableHead, TableScroller } from "@/components/ds/primitives";
import { timeAgo } from "@/lib/format";
import { PROVIDER_LABEL, SEVERITY_META, STATUS_META } from "@/lib/incident-meta";
import type { IncidentQuery, SortKey } from "@/lib/incident-query";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IncidentTableProps {
  incidents: Incident[];
  query: IncidentQuery;
  onSort: (key: SortKey) => void;
}

const COLUMNS = ".8fr 1.6fr 1.7fr 1.1fr .7fr .8fr";

function fileLocation(incident: Incident) {
  return incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;
}

function SortHeading({
  label,
  sortKey,
  query,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  query: IncidentQuery;
  onSort: (key: SortKey) => void;
}) {
  const active = query.sort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label.toLowerCase()}`}
      className={cn(
        "cursor-pointer font-mono uppercase tracking-[.12em]",
        active ? "text-[#f5f5f7]" : "hover:text-[#f5f5f7]",
      )}
    >
      {label}
      {active && <span aria-hidden> {query.direction === "desc" ? "↓" : "↑"}</span>}
    </button>
  );
}

export function IncidentTable({ incidents, query, onSort }: IncidentTableProps) {
  const sortHeading = (label: string, sortKey: SortKey) => ({
    label,
    node: <SortHeading label={label} sortKey={sortKey} query={query} onSort={onSort} />,
  });

  return (
    <Card as="section" aria-label="Incidents" className="overflow-hidden">
      <TableScroller minWidth={820} label="Incidents">
        <TableHead
          columns={COLUMNS}
          labels={["Severity", "Secret", "Location", "Status", sortHeading("Risk", "risk"), sortHeading("Detected", "detected")]}
        />
        {incidents.map((incident) => {
          const status = STATUS_META[incident.status];
          return (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              role="row"
              style={{ gridTemplateColumns: COLUMNS }}
              className="grid items-center gap-3 border-b border-white/6 px-[18px] py-3 transition-colors hover:bg-white/3"
            >
              <StatusCell className={SEVERITY_META[incident.severity].text}>{incident.severity}</StatusCell>
              <Cell className="flex flex-col gap-0.5">
                <span className="text-[13px]">{incident.secretType}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {PROVIDER_LABEL[incident.provider]} · {incident.maskedValue}
                </span>
              </Cell>
              <Cell className="flex flex-col gap-0.5">
                <span className="truncate font-mono text-[12px]">
                  {incident.repositoryOwner}/{incident.repositoryName}
                </span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{fileLocation(incident)}</span>
              </Cell>
              <Cell className="flex flex-col gap-0.5">
                <MonoStatus className={status.text}>{incident.status.replaceAll("_", " ")}</MonoStatus>
                {incident.simulated && <MonoStatus className="text-simulation">simulated</MonoStatus>}
              </Cell>
              <Cell className="font-mono text-[12px]">{incident.riskScore}</Cell>
              <Cell className="text-[12px] text-muted-foreground">
                <time dateTime={incident.createdAt} suppressHydrationWarning>
                  {timeAgo(incident.createdAt)}
                </time>
              </Cell>
            </Link>
          );
        })}
      </TableScroller>
    </Card>
  );
}
