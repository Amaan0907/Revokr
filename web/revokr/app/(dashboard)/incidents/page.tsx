import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/primitives";
import { IncidentsView } from "@/components/incidents/incidents-view";
import { NoIncidents } from "@/components/states/no-incidents";
import { getIncidents, getSetupContext } from "@/lib/data";
import { parseIncidentQuery, toSearchParams } from "@/lib/incident-query";

export const metadata: Metadata = { title: "Incidents" };

interface IncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const initialQuery = parseIncidentQuery(await searchParams);
  const incidents = await getIncidents();
  const { monitored, lastPushAt } = await getSetupContext();
  const organization = incidents[0]?.repositoryOwner || "your organization";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Incidents"
        title="Every secret Revokr has found"
        description={`Across ${organization}'s monitored repositories, and where each one is in remediation.`}
      />
      {incidents.length === 0 ? (
        <NoIncidents monitored={monitored} lastPushAt={lastPushAt} />
      ) : (
        // Keyed by the query so a search from the sidebar resets the view even on this page.
        <IncidentsView
          key={toSearchParams(initialQuery).toString()}
          incidents={incidents}
          initialQuery={initialQuery}
        />
      )}
    </div>
  );
}
