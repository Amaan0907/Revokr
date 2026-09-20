"use client";

import { Card, Cell, StatusCell, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { formatTime } from "@/lib/format";
import { ACTION_META } from "@/lib/incident-meta";
import type { ActionStatus } from "@/lib/types";
import { useLiveIncident } from "./incident-live";

const COLUMNS = "1.4fr .8fr 2fr .8fr .8fr";

const STATUS: Record<ActionStatus, { label: string; text: string }> = {
  PENDING: { label: "pending", text: "text-muted-foreground" },
  RUNNING: { label: "running", text: "text-progress" },
  SUCCEEDED: { label: "succeeded", text: "text-resolved" },
  FAILED: { label: "failed", text: "text-failed" },
};

const time = (iso: string | null) => (iso ? `${formatTime(iso)}Z` : "—");

// Every action row as the API returns it. The order strip tells the story; this is the record.
export function ActionsTable() {
  const { actions } = useLiveIncident();
  if (actions.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="actions-heading" className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-white/8 px-[18px] py-4">
        <h2 id="actions-heading" className="m-0 text-[14px] font-medium">
          Remediation actions
        </h2>
        <span className="text-[12px] text-muted-foreground">Each step Revokr took or attempted, with its outcome.</span>
      </div>

      <TableScroller minWidth={700} label="Remediation actions">
        <TableHead columns={COLUMNS} labels={["Action type", "Status", "Error", "Started", "Completed"]} />
        {actions.map((action) => {
          const status = STATUS[action.status];
          return (
            <TableRow key={action.id} columns={COLUMNS}>
              <Cell className="text-[12px]">{ACTION_META[action.actionType].label}</Cell>
              <StatusCell className={status.text}>{status.label}</StatusCell>
              <Cell className="font-mono text-[11px] leading-[1.5] text-muted-foreground">{action.error ?? "—"}</Cell>
              <Cell className="font-mono text-[11px] text-muted-foreground">{time(action.startedAt)}</Cell>
              <Cell className="font-mono text-[11px] text-muted-foreground">{time(action.completedAt)}</Cell>
            </TableRow>
          );
        })}
      </TableScroller>
    </Card>
  );
}
