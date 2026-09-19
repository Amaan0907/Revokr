import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Hourglass, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { ActivityFeed, type ActivityItem } from "@/components/overview/activity-feed";
import { AttentionList } from "@/components/overview/attention-list";
import { FocusBanner } from "@/components/overview/focus-banner";
import { RemediationPipeline } from "@/components/overview/remediation-pipeline";
import { SeverityBreakdown } from "@/components/overview/severity-breakdown";
import { StatCard } from "@/components/overview/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import { mockAuditLog, mockIncidents } from "@/lib/mock-data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const session = await getSession();
  const incidents = mockIncidents;
  const organization = incidents[0]?.repositoryOwner ?? "your organization";
  const firstName = (session?.user.name ?? session?.user.login ?? "").split(" ")[0];

  const open = incidents.filter((i) => !["resolved", "closed"].includes(STATUS_META[i.status].group));
  const criticalOpen = open.filter((i) => i.severity === "CRITICAL").length;
  const awaiting = incidents.filter((i) => i.status === "AWAITING_APPROVAL");
  const needsAttention = incidents.filter((i) =>
    ["attention", "failed"].includes(STATUS_META[i.status].group),
  );

  const resolved = incidents.filter((i) => i.status === "RESOLVED" && i.resolvedAt);
  const meanTimeToRemediate = resolved.length
    ? resolved.reduce(
        (total, i) => total + new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime(),
        0,
      ) / resolved.length
    : null;

  const incidentById = new Map(incidents.map((i) => [i.id, i]));
  const recentActivity: ActivityItem[] = [...mockAuditLog]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 7)
    .flatMap((entry) => {
      const incident = incidentById.get(entry.incidentId);
      return incident ? [{ entry, incident }] : [];
    });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[15px] font-medium text-muted-foreground">
            Welcome back{firstName && `, ${firstName}`}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.035em]">Overview</h1>
          <p className="mt-1 max-w-xl text-[15px] text-muted-foreground">
            Leaked secrets across {organization}&apos;s repositories, and where each one is in
            remediation.
          </p>
        </div>
        <Link href="/incidents" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          All incidents
          <ChevronRight aria-hidden data-icon="inline-end" />
        </Link>
      </header>

      <FocusBanner awaiting={awaiting} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          tone="critical"
          icon={ShieldAlert}
          label="Open incidents"
          value={open.length}
          unit="open"
          href="/incidents"
          detail={criticalOpen > 0 ? `${criticalOpen} critical right now` : "None critical"}
        />
        <StatCard
          index={1}
          tone="approval"
          icon={Hourglass}
          label="Awaiting approval"
          value={awaiting.length}
          unit="waiting"
          href="/incidents?view=attention"
          pulse={awaiting.length > 0}
          detail={awaiting.length > 0 ? "A rotation is ready to run" : "Nothing waiting on you"}
        />
        <StatCard
          index={2}
          tone="progress"
          icon={Timer}
          label="Time to remediate"
          value={meanTimeToRemediate === null ? "—" : formatDuration(meanTimeToRemediate)}
          href="/incidents?view=resolved"
          detail="Average, detection to verified rotation"
        />
        <StatCard
          index={3}
          tone="resolved"
          icon={ShieldCheck}
          label="Credentials rotated"
          value={resolved.length}
          unit="rotated"
          href="/incidents?view=resolved"
          detail="Leaked keys confirmed dead"
        />
      </div>

      <RemediationPipeline incidents={incidents} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionList incidents={needsAttention} />
        </div>
        <div className="flex flex-col gap-6">
          <SeverityBreakdown incidents={open} />
          <ActivityFeed items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
