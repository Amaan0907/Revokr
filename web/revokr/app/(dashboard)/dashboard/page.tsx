import type { Metadata } from "next";
import { PageHeader, ScrollPane } from "@/components/ds/primitives";
import { FirstRunOverview } from "@/components/onboarding/first-run-overview";
import { ActivityFeed, type ActivityItem } from "@/components/overview/activity-feed";
import { AttentionList } from "@/components/overview/attention-list";
import { FocusBanner } from "@/components/overview/focus-banner";
import { RemediationPipeline } from "@/components/overview/remediation-pipeline";
import { SeverityBreakdown } from "@/components/overview/severity-breakdown";
import { StatCard } from "@/components/overview/stat-card";
import { getAuditFeed, getIncidents, getSetupContext } from "@/lib/data";
import { formatDuration } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const session = await getSession();
  const [incidents, auditLog] = await Promise.all([getIncidents(), getAuditFeed()]);
  const setup = await getSetupContext();
  // Nothing watched and nothing found: show the setup checklist rather than a page of zeroes.
  const firstRun = incidents.length === 0 && setup.monitored === 0;
  const organization = incidents[0]?.repositoryOwner ?? "your organization";
  const firstName = (session?.user.name ?? session?.user.login ?? "").split(" ")[0];

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
    .slice(0, 7)
    .flatMap((entry) => {
      const incident = incidentById.get(entry.incidentId);
      return incident ? [{ entry, incident }] : [];
    });

  return (
    <div className="flex flex-col gap-5 lg:flex-1">
      <PageHeader
        eyebrow={`Overview${firstName ? ` · welcome back, ${firstName}` : ""}`}
        title="Where every leaked secret stands"
        description={`Leaked secrets across ${organization}'s repositories, and where each one is in remediation.`}
      />

      {firstRun ? (
        <FirstRunOverview installation={setup.installation} />
      ) : (
        <>
          <FocusBanner awaiting={awaiting} />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
            <StatCard
              tone="critical"
              label="Open incidents"
              value={open.length}
              href="/incidents"
              detail={criticalOpen > 0 ? `${criticalOpen} critical right now` : "None critical"}
            />
            <StatCard
              tone="approval"
              label="Awaiting approval"
              value={awaiting.length}
              href="/incidents?view=attention"
              detail={awaiting.length > 0 ? "A rotation is ready to run" : "Nothing waiting on you"}
            />
            <StatCard
              tone="progress"
              label="Time to remediate"
              value={meanTimeToRemediate === null ? "—" : formatDuration(meanTimeToRemediate)}
              href="/incidents?view=resolved"
              detail="Average, detection to verified rotation"
            />
            <StatCard
              tone="resolved"
              label="Credentials rotated"
              value={resolved.length}
              href="/incidents?view=resolved"
              detail="Leaked keys confirmed dead"
            />
          </div>

          <RemediationPipeline incidents={incidents} />

          {/* On desktop this row takes the rest of the screen and each column scrolls by itself, so
              the short attention list stays put while the long right column scrolls. It never gets
              shorter than the minimum, so on a small screen the page scrolls to reach it. */}
          <div className="grid gap-4 lg:min-h-[360px] lg:flex-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ScrollPane>
              <AttentionList incidents={needsAttention} />
            </ScrollPane>
            <ScrollPane className="flex flex-col gap-4">
              <SeverityBreakdown incidents={open} />
              <ActivityFeed items={recentActivity} />
            </ScrollPane>
          </div>
        </>
      )}
    </div>
  );
}
