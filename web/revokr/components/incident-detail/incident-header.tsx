import { CalendarClock, FileCode, FolderGit2, GitCommitHorizontal } from "lucide-react";
import { RiskGauge } from "./risk-gauge";
import { SeverityBadge, SimulatedBadge, StatusBadge } from "@/components/incidents/badges";
import { timeAgo } from "@/lib/format";
import { MOTION_CLASS, STATUS_META } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IncidentHeader({ incident }: { incident: Incident }) {
  const status = STATUS_META[incident.status];
  const StatusIcon = status.icon;
  const file =
    incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;

  return (
    <header className="flex flex-col gap-5 rounded-xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both sm:p-6">
      <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {incident.simulated && <SimulatedBadge />}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance">
            {incident.secretType}
          </h1>
          <code className="mt-2 inline-block max-w-full truncate rounded-md bg-muted px-2 py-1 font-mono text-sm">
            {incident.maskedValue}
          </code>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <FolderGit2 aria-hidden className="size-4" />
              {incident.repositoryOwner}/{incident.repositoryName}
            </li>
            <li className="flex min-w-0 items-center gap-1.5">
              <FileCode aria-hidden className="size-4 shrink-0" />
              <span className="truncate font-mono">{file}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <GitCommitHorizontal aria-hidden className="size-4" />
              <span className="sr-only">Commit</span>
              <span className="font-mono" title={incident.commitSha}>
                {incident.commitSha.slice(0, 7)}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarClock aria-hidden className="size-4" />
              Detected{" "}
              <time dateTime={incident.createdAt}>{timeAgo(incident.createdAt)}</time>
            </li>
          </ul>
        </div>

        <RiskGauge score={incident.riskScore} severity={incident.severity} />
      </div>

      <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", status.bg, status.border)}>
        <StatusIcon
          aria-hidden
          className={cn("mt-0.5 size-4 shrink-0", status.text, status.motion && MOTION_CLASS[status.motion])}
        />
        <p>
          <span className={cn("font-medium", status.text)}>{status.label}.</span>{" "}
          <span className="text-foreground/80">{status.description}</span>
        </p>
      </div>
    </header>
  );
}
