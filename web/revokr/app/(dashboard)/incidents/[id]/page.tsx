import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionsTable } from "@/components/incident-detail/actions-table";
import { ActivityTimeline } from "@/components/incident-detail/activity-timeline";
import { AnalystPanel } from "@/components/incident-detail/analyst-panel";
import { HistoryWarning } from "@/components/incident-detail/history-warning";
import { IncidentHeader } from "@/components/incident-detail/incident-header";
import { LiveIncidentProvider } from "@/components/incident-detail/incident-live";
import { RemediationOrder } from "@/components/incident-detail/remediation-order";
import { RiskBreakdown } from "@/components/incident-detail/risk-breakdown";
import { StatusCard } from "@/components/incident-detail/status-card";
import { getIncidentDetail } from "@/lib/data";
import { MOCK_OPERATOR } from "@/lib/mock-data";
import { getDataSource } from "@/lib/live-data";
import { getSession } from "@/lib/session";

interface IncidentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IncidentPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getIncidentDetail(id);
  return {
    title: detail
      ? `${detail.incident.secretType} in ${detail.incident.repositoryName}`
      : "Incident not found",
  };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  const detail = await getIncidentDetail(id);
  if (!detail) notFound();

  const { incident } = detail;
  const source = (await getDataSource()) === "live" ? "api" : "sample";
  const session = await getSession();

  return (
    <LiveIncidentProvider
      detail={detail}
      operator={source === "api" ? (session?.user.login ?? MOCK_OPERATOR) : MOCK_OPERATOR}
      source={source}
    >
      <div className="flex flex-col gap-[18px]">
        <IncidentHeader incident={incident} />
        <StatusCard incident={incident} />
        <RemediationOrder initialStatus={incident.status} />
        <ActionsTable />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <AnalystPanel analysis={detail.analysis} initialStatus={incident.status} />
            <ActivityTimeline />
          </div>
          <div className="flex flex-col gap-4">
            <RiskBreakdown incident={incident} />
            <HistoryWarning />
          </div>
        </div>
      </div>
    </LiveIncidentProvider>
  );
}
