"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Btn, btn, Card, Cell, Eyebrow, PILL, StatusCell, TableHead, TableScroller } from "@/components/ds/primitives";
import { formatAuditTimestamp } from "@/lib/format";
import { AUDIT_ACTION_META } from "@/lib/incident-meta";
import type { AuditAction, AuditLogEntry, AuditResult, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

// One audit entry joined with the incident it belongs to, so a row can say what it was about
// without a second request. Nothing here is a raw secret: only the fingerprint and masked value.
export interface AuditRow {
  entry: AuditLogEntry;
  incident: {
    label: string;
    provider: string;
    secretType: string;
    fingerprint: string;
    maskedValue: string;
    isLive: boolean | null;
    riskScore: number;
    severity: Severity;
    commitSha: string;
    filePath: string;
    lineNumber: number | null;
    simulated: boolean;
  };
}

type Range = "24h" | "7d" | "30d" | "all";

const RANGES: { id: Range; label: string; ms: number }[] = [
  { id: "24h", label: "Last 24 hours", ms: 24 * 60 * 60_000 },
  { id: "7d", label: "Last 7 days", ms: 7 * 24 * 60 * 60_000 },
  { id: "30d", label: "Last 30 days", ms: 30 * 24 * 60 * 60_000 },
  { id: "all", label: "All time", ms: Infinity },
];

interface Filters {
  actor: string;
  action: string;
  result: string;
  range: Range;
}

const ANY = "all";
const DEFAULT_FILTERS: Filters = { actor: ANY, action: ANY, result: ANY, range: "7d" };
const PAGE_SIZE = 10;
const COLUMNS = "24px 1.3fr 1fr 1.2fr .8fr 1.8fr";

const RESULT_TONE: Record<AuditResult, string> = {
  success: "text-resolved",
  failure: "text-failed",
  pending: "text-progress",
};

interface Option {
  value: string;
  label: string;
}

// A pill that shows the current value and opens a native select laid invisibly over it, so the pill
// is exactly as wide as its label and value, not as wide as the longest option.
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value)?.label ?? value;
  return (
    <label className={cn(PILL, "relative cursor-pointer focus-within:border-white/20")}>
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[12px]">
        {current} <span aria-hidden>▾</span>
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0 [&>option]:bg-[#1c1c1e]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportCsv(rows: AuditRow[]) {
  const header = ["id", "timestamp", "actor", "action", "result", "incident_id", "provider", "secret_type", "repository", "simulated"];
  const lines = rows.map(({ entry, incident }) =>
    [
      entry.id,
      formatAuditTimestamp(entry.timestamp),
      entry.actor,
      entry.action,
      entry.result,
      entry.incidentId,
      incident.provider,
      incident.secretType,
      incident.label.split(" · ").at(-1) ?? "",
      incident.simulated,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "revokr-audit-log.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function Metadata({ row }: { row: AuditRow }) {
  const { entry, incident } = row;
  const file = incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(incident.fingerprint);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be blocked; the fingerprint is on screen to copy by hand.
    }
  };

  const fields: [string, string][] = [
    ["id", entry.id],
    ["incident_id", entry.incidentId],
    ["provider", incident.provider],
    ["secret_type", incident.secretType],
    ["fingerprint", incident.fingerprint],
    ["masked_value", incident.maskedValue],
    ["is_live", String(incident.isLive)],
    ["risk_score", String(incident.riskScore)],
    ["severity", incident.severity],
    ["commit_sha", incident.commitSha.slice(0, 7)],
    ["file_path", file],
    ["simulated", String(incident.simulated)],
    ...Object.entries(entry.metadata ?? {}).map(([key, value]): [string, string] => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  ];

  return (
    <div className="flex flex-col gap-2 px-[18px] pb-4 pl-[18px] sm:pl-[54px]">
      <Eyebrow className="tracking-[.12em]">metadata</Eyebrow>
      <div className="overflow-x-auto rounded-[12px] border border-white/8 bg-black p-3.5 font-mono text-[11px] leading-[1.75] text-muted-foreground">
        {fields.map(([key, value]) => (
          <div key={key}>
            {key}: <span className="break-all text-[#f5f5f7]">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/incidents/${entry.incidentId}`} className={btn({ size: "sm" })}>
          Open incident
        </Link>
        <Btn size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy fingerprint"}
        </Btn>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">
        The raw secret value is never part of an audit entry.
      </span>
    </div>
  );
}

interface AuditViewProps {
  rows: AuditRow[];
  // Fixed by the server so the date filter agrees between the server render and the browser.
  now: number;
}

export function AuditView({ rows, now }: AuditViewProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(rows[0]?.entry.id ?? null);

  const actors = useMemo(() => [...new Set(rows.map((row) => row.entry.actor))].sort(), [rows]);

  const results = useMemo(() => {
    const window = RANGES.find((range) => range.id === filters.range)?.ms ?? Infinity;
    return rows.filter(({ entry }) => {
      if (filters.actor !== ANY && entry.actor !== filters.actor) return false;
      if (filters.action !== ANY && entry.action !== filters.action) return false;
      if (filters.result !== ANY && entry.result !== filters.result) return false;
      return now - new Date(entry.timestamp).getTime() <= window;
    });
  }, [rows, filters, now]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = results.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(0);
    setExpanded(null);
  };

  const clear = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
    setExpanded(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="actor"
          value={filters.actor}
          onChange={(v) => setFilter("actor", v)}
          options={[{ value: ANY, label: "All" }, ...actors.map((actor) => ({ value: actor, label: actor }))]}
        />
        <FilterSelect
          label="action"
          value={filters.action}
          onChange={(v) => setFilter("action", v)}
          options={[
            { value: ANY, label: `All ${Object.keys(AUDIT_ACTION_META).length}` },
            ...(Object.keys(AUDIT_ACTION_META) as AuditAction[]).map((action) => ({ value: action, label: action })),
          ]}
        />
        <FilterSelect
          label="result"
          value={filters.result}
          onChange={(v) => setFilter("result", v)}
          options={[
            { value: ANY, label: "Any" },
            { value: "success", label: "success" },
            { value: "failure", label: "failure" },
            { value: "pending", label: "pending" },
          ]}
        />
        <FilterSelect
          label="range"
          value={filters.range}
          onChange={(v) => setFilter("range", v as Range)}
          options={RANGES.map((range) => ({ value: range.id, label: range.label }))}
        />
        <Btn size="sm" className="ml-auto" disabled={results.length === 0} onClick={() => exportCsv(results)}>
          Export CSV
        </Btn>
      </div>

      {results.length > 0 ? (
        <Card as="section" aria-label="Audit entries" className="overflow-hidden">
          <TableScroller minWidth={760} label="Audit entries">
            <TableHead columns={COLUMNS} labels={["", "Timestamp", "Actor", "Action", "Result", "Incident"]} />
            {visible.map((row) => {
              const { entry } = row;
              const open = expanded === entry.id;
              return (
                <div key={entry.id} role="rowgroup" className="border-b border-white/6">
                  <button
                    type="button"
                    role="row"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : entry.id)}
                    style={{ gridTemplateColumns: COLUMNS }}
                    className="grid w-full cursor-pointer items-center gap-3 px-[18px] py-3 text-left"
                  >
                    <Cell className="font-mono text-[11px] text-muted-foreground">{open ? "▾" : "▸"}</Cell>
                    <Cell className="font-mono text-[11px]">{formatAuditTimestamp(entry.timestamp)}</Cell>
                    <Cell className="text-[12px]">{entry.actor}</Cell>
                    <Cell className="font-mono text-[11px]">{entry.action}</Cell>
                    <StatusCell className={RESULT_TONE[entry.result]}>{entry.result}</StatusCell>
                    <Cell className="overflow-hidden font-mono text-[11px] text-ellipsis whitespace-nowrap text-muted-foreground">
                      {row.incident.label}
                    </Cell>
                  </button>
                  {open && <Metadata row={row} />}
                </div>
              );
            })}
          </TableScroller>

          <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-[13px]">
            <span aria-live="polite" className="font-mono text-[11px] text-muted-foreground">
              {current * PAGE_SIZE + 1}–{current * PAGE_SIZE + visible.length} of {results.length}
            </span>
            <div className="ml-auto flex gap-2">
              <Btn size="sm" className="py-1.5 px-[13px]" disabled={current === 0} onClick={() => setPage(current - 1)}>
                Previous
              </Btn>
              <Btn size="sm" className="py-1.5 px-[13px]" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
                Next
              </Btn>
            </div>
          </div>
        </Card>
      ) : (
        <Card as="section" className="flex max-w-[560px] flex-col items-start gap-3 rounded-[20px] p-8">
          <h2 className="m-0 text-xl font-medium tracking-[-.02em]">No entries match these filters</h2>
          <p className="m-0 text-[13px] leading-[1.6] text-muted-foreground">
            The log is append-only, so an empty result means nothing happened in this window — not that
            anything was removed.
          </p>
          <Btn size="sm" onClick={clear}>
            Clear filters
          </Btn>
        </Card>
      )}
    </>
  );
}
