import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Hourglass, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { AttentionList } from "@/components/overview/attention-list";
import { StatCard } from "@/components/overview/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { STATUS_META } from "@/lib/incident-meta";
import { mockIncidents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  const incidents = mockIncidents;
  const organization = incidents[0]?.repositoryOwner ?? "your organization";

  const open = incidents.filter((i) => !["resolved", "closed"].includes(STATUS_META[i.status].group));
  const criticalOpen = open.filter((i) => i.severity === "CRITICAL").length;
  const awaitingApproval = incidents.filter((i) => i.status === "AWAITING_APPROVAL").length;
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Security overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leaked secrets across {organization}&apos;s repositories, and where each one is in
            remediation.
          </p>
        </div>
        <Link
          href="/incidents"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit rounded-md")}
        >
          All incidents
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Link>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Open incidents"
          value={String(open.length)}
          icon={ShieldAlert}
          detail={
            criticalOpen > 0 ? (
              <span className="text-critical">{criticalOpen} critical</span>
            ) : (
              "None critical"
            )
          }
        />
        <StatCard
          index={1}
          label="Awaiting approval"
          value={String(awaitingApproval)}
          icon={Hourglass}
          highlight={awaitingApproval > 0}
          detail={awaitingApproval > 0 ? "Rotation is ready to run" : "Nothing waiting on you"}
        />
        <StatCard
          index={2}
          label="Mean time to remediate"
          value={meanTimeToRemediate === null ? "—" : formatDuration(meanTimeToRemediate)}
          icon={Timer}
          detail="From detection to verified rotation"
        />
        <StatCard
          index={3}
          label="Credentials rotated"
          value={String(resolved.length)}
          icon={ShieldCheck}
          detail="Leaked keys confirmed dead"
        />
      </dl>

      <AttentionList incidents={needsAttention} />
    </div>
  );
}
