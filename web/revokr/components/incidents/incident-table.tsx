import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { SeverityBadge, StatusBadge } from "./badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timeAgo } from "@/lib/format";
import { PROVIDER_LABEL, SEVERITY_META } from "@/lib/incident-meta";
import type { IncidentQuery, SortKey } from "@/lib/incident-query";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IncidentTableProps {
  incidents: Incident[];
  query: IncidentQuery;
  onSort: (key: SortKey) => void;
}

const HEAD = "h-11 text-xs font-medium text-muted-foreground";

function fileLocation(incident: Incident) {
  return incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;
}

function Detected({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()} suppressHydrationWarning>
      {timeAgo(iso)}
    </time>
  );
}

function RiskScore({ incident }: { incident: Incident }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-6 text-right font-medium tabular-nums">{incident.riskScore}</span>
      <span aria-hidden className="h-1.5 w-14 overflow-hidden rounded-full bg-white/[0.08]">
        <span
          className={cn("block h-full origin-left animate-grow-x rounded-full", SEVERITY_META[incident.severity].fill)}
          style={{ transform: `scaleX(${incident.riskScore / 100})` }}
        />
      </span>
    </span>
  );
}

function SortHeader({
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
  const Icon = query.direction === "desc" ? ArrowDown : ArrowUp;
  return (
    <TableHead
      aria-sort={active ? (query.direction === "desc" ? "descending" : "ascending") : "none"}
      className={HEAD}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
          active ? "text-foreground" : "hover:text-foreground",
        )}
      >
        {label}
        <Icon aria-hidden className={cn("size-3.5 transition-opacity", active ? "opacity-100" : "opacity-0")} />
      </button>
    </TableHead>
  );
}

export function IncidentTable({ incidents, query, onSort }: IncidentTableProps) {
  return (
    <>
      <div className="surface hidden overflow-hidden rounded-3xl md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className={cn(HEAD, "pl-6")}>Severity</TableHead>
              <TableHead className={HEAD}>Secret</TableHead>
              <TableHead className={HEAD}>Location</TableHead>
              <TableHead className={HEAD}>Status</TableHead>
              <SortHeader label="Risk" sortKey="risk" query={query} onSort={onSort} />
              <SortHeader label="Detected" sortKey="detected" query={query} onSort={onSort} />
              <TableHead className="w-10">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident, i) => (
              <TableRow
                key={incident.id}
                style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                className="group relative border-white/[0.05] animate-in fade-in slide-in-from-bottom-1 animation-duration-500 fill-mode-both hover:bg-white/[0.03] has-[a:focus-visible]:bg-white/[0.05]"
              >
                <TableCell className="py-4 pl-6">
                  <SeverityBadge severity={incident.severity} />
                </TableCell>
                <TableCell className="py-4">
                  <Link
                    href={`/incidents/${incident.id}`}
                    className="text-[15px] font-medium outline-none after:absolute after:inset-0"
                  >
                    {incident.secretType}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{PROVIDER_LABEL[incident.provider]}</span>
                    <span aria-hidden>·</span>
                    <code className="max-w-44 truncate font-mono">{incident.maskedValue}</code>
                  </p>
                </TableCell>
                <TableCell className="py-4">
                  <p className="text-sm">
                    {incident.repositoryOwner}/{incident.repositoryName}
                  </p>
                  <p className="mt-0.5 max-w-56 truncate font-mono text-xs text-muted-foreground">
                    {fileLocation(incident)}
                  </p>
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={incident.status} />
                </TableCell>
                <TableCell className="py-4">
                  <RiskScore incident={incident} />
                </TableCell>
                <TableCell className="py-4 text-[13px] text-muted-foreground">
                  <Detected iso={incident.createdAt} />
                </TableCell>
                <TableCell className="py-4 pr-5">
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="surface divide-y divide-white/[0.06] overflow-hidden rounded-3xl md:hidden">
        {incidents.map((incident, i) => (
          <li
            key={incident.id}
            style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            className="animate-in fade-in animation-duration-500 fill-mode-both"
          >
            <Link
              href={`/incidents/${incident.id}`}
              className="flex items-center gap-3 px-4 py-4 transition-colors active:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={incident.severity} className="h-5 px-2 text-[11px]" />
                  <StatusBadge status={incident.status} className="h-5 px-2 text-[11px]" />
                </div>
                <p className="mt-2 text-[15px] font-medium">{incident.secretType}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {incident.repositoryOwner}/{incident.repositoryName} ·{" "}
                  <span className="font-mono">{fileLocation(incident)}</span>
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                  <RiskScore incident={incident} />
                  <Detected iso={incident.createdAt} />
                </div>
              </div>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/50" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
