import { CalendarClock, FileCode, FolderGit2, GitCommitHorizontal } from "lucide-react";
import { LiveStatusBadge, LiveStatusCallout } from "./live-status";
import { RiskGauge } from "./risk-gauge";
import { SeverityBadge, SimulatedBadge } from "@/components/incidents/badges";
import { timeAgo } from "@/lib/format";
import type { Incident } from "@/lib/types";

export function IncidentHeader({ incident }: { incident: Incident }) {
  const file =
    incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;

  return (
    <header className="surface relative overflow-hidden rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-2 animation-duration-700 fill-mode-both sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_90%_at_100%_0%,rgb(255_255_255/0.06),transparent_70%)]"
      />

      <div className="relative flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <LiveStatusBadge />
            {incident.simulated && <SimulatedBadge />}
          </div>

          <h1 className="mt-4 text-[length:clamp(1.5rem,2.8vw,2rem)] font-bold leading-tight tracking-[-0.035em] text-balance">
            {incident.secretType}
          </h1>
          <code className="mt-3 inline-block max-w-full truncate rounded-xl bg-white/[0.06] px-3 py-1.5 font-mono text-sm ring-1 ring-inset ring-white/[0.06]">
            {incident.maskedValue}
          </code>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <FolderGit2 aria-hidden className="size-4" />
              <span className="text-foreground/90">
                {incident.repositoryOwner}/{incident.repositoryName}
              </span>
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
              Detected <time dateTime={incident.createdAt}>{timeAgo(incident.createdAt)}</time>
            </li>
          </ul>
        </div>

        <RiskGauge score={incident.riskScore} severity={incident.severity} />
      </div>

      <div className="relative mt-6">
        <LiveStatusCallout />
      </div>
    </header>
  );
}
