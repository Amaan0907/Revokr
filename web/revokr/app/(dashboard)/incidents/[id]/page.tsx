import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IncidentDetails } from "@/components/incident-detail/incident-details";
import { IncidentHeader } from "@/components/incident-detail/incident-header";
import { LiveIncidentProvider } from "@/components/incident-detail/incident-live";
import { RemediationChecklist } from "@/components/incident-detail/remediation-checklist";
import { RiskBreakdown } from "@/components/incident-detail/risk-breakdown";
import { getMockIncidentDetail, MOCK_OPERATOR } from "@/lib/mock-data";

interface IncidentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IncidentPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = getMockIncidentDetail(id);
  return {
    title: detail
      ? `${detail.incident.secretType} in ${detail.incident.repositoryName}`
      : "Incident not found",
  };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  const detail = getMockIncidentDetail(id);
  if (!detail) notFound();

  const { incident } = detail;

  return (
    <LiveIncidentProvider detail={detail} operator={MOCK_OPERATOR}>
      <div className="flex flex-col gap-6">
        <Link
          href="/incidents"
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Incidents
        </Link>

        <IncidentHeader incident={incident} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <RemediationChecklist incident={incident} />
          </div>
          <div className="flex flex-col gap-6">
            <RiskBreakdown incident={incident} />
            <IncidentDetails incident={incident} />
          </div>
        </div>
      </div>
    </LiveIncidentProvider>
  );
}
