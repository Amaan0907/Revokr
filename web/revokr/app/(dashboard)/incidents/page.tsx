import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/primitives";
import { IncidentsView } from "@/components/incidents/incidents-view";
import { NoIncidents } from "@/components/states/no-incidents";
import { parseIncidentQuery, toSearchParams } from "@/lib/incident-query";
import { mockIncidents, mockRepositories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Incidents" };

interface IncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const initialQuery = parseIncidentQuery(await searchParams);
  const organization = mockIncidents[0]?.repositoryOwner ?? "your organization";
  const monitored = mockRepositories.filter((repository) => repository.enabled);
  const lastPushAt =
    monitored
      .map((repository) => repository.lastPushAt)
      .filter((time): time is string => time !== null)
      .sort()
      .at(-1) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Incidents"
        title="Every secret Revokr has found"
        description={`Across ${organization}'s monitored repositories, and where each one is in remediation.`}
      />
      {mockIncidents.length === 0 ? (
        <NoIncidents monitored={monitored.length} lastPushAt={lastPushAt} />
      ) : (
        // Keyed by the query so a search from the sidebar resets the view even on this page.
        <IncidentsView
          key={toSearchParams(initialQuery).toString()}
          incidents={mockIncidents}
          initialQuery={initialQuery}
        />
      )}
    </div>
  );
}
