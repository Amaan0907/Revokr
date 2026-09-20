import { ActivityFeed, type ActivityItem } from "@/components/overview/activity-feed";
import { AttentionList } from "@/components/overview/attention-list";
import { FocusBanner } from "@/components/overview/focus-banner";
import { RemediationPipeline } from "@/components/overview/remediation-pipeline";
import { SeverityBreakdown } from "@/components/overview/severity-breakdown";
import { StatCard } from "@/components/overview/stat-card";
import { formatDuration } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import type { AuditLogEntry, Incident } from "@/lib/types";

interface IncidentSummaryProps {
  // Only this project's incidents, and the audit log, which is narrowed to them here.
  incidents: Incident[];
  auditLog: AuditLogEntry[];
  // "owner/name", so the stat cards open the incidents list filtered to this project.
  project: string;
}

// Where one project's leaked secrets stand: what needs approving, the headline numbers, the
// remediation pipeline and the latest activity. It is the same summary the overview used to show for
// everything, now scoped to the project that was opened.
export function IncidentSummary({ incidents, auditLog, project }: IncidentSummaryProps) {
  const link = (view?: string) => {
    const query = new URLSearchParams({ q: project, ...(view ? { view } : {}) });
    return `/incidents?${query.toString()}`;
  };

  const open = incidents.filter((i) => !["resolved", "closed"].includes(STATUS_META[i.status].group));
  const criticalOpen = open.filter((i) => i.severity === "CRITICAL").length;
  const awaiting = incidents.filter((i) => i.status === "AWAITING_APPROVAL");
  const needsAttention = incidents.filter((i) => ["attention", "failed"].includes(STATUS_META[i.status].group));

  const resolved = incidents.filter((i) => i.status === "RESOLVED" && i.resolvedAt);
  const meanTimeToRemediate = resolved.length
    ? resolved.reduce((total, i) => total + new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime(), 0) /
      resolved.length
    : null;

  const incidentById = new Map(incidents.map((i) => [i.id, i]));
  const recentActivity: ActivityItem[] = [...auditLog]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .flatMap((entry) => {
      const incident = incidentById.get(entry.incidentId);
      return incident ? [{ entry, incident }] : [];
    })
    .slice(0, 7);

  return (
    <>
      <FocusBanner awaiting={awaiting} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        <StatCard
          tone="critical"
          label="Open incidents"
          value={open.length}
          href={link()}
          detail={criticalOpen > 0 ? `${criticalOpen} critical right now` : "None critical"}
        />
        <StatCard
          tone="approval"
          label="Awaiting approval"
          value={awaiting.length}
          href={link("attention")}
          detail={awaiting.length > 0 ? "A rotation is ready to run" : "Nothing waiting on you"}
        />
        <StatCard
          tone="progress"
          label="Time to remediate"
          value={meanTimeToRemediate === null ? "—" : formatDuration(meanTimeToRemediate)}
          href={link("resolved")}
          detail="Average, detection to verified rotation"
        />
        <StatCard
          tone="resolved"
          label="Credentials rotated"
          value={resolved.length}
          href={link("resolved")}
          detail="Leaked keys confirmed dead"
        />
      </div>

      <RemediationPipeline incidents={incidents} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AttentionList incidents={needsAttention} />
        <div className="flex flex-col gap-4">
          <SeverityBreakdown incidents={open} />
          <ActivityFeed items={recentActivity} />
        </div>
      </div>
    </>
  );
}
