import type { Metadata } from "next";
import { IncidentsView } from "@/components/incidents/incidents-view";
import { parseIncidentQuery, toSearchParams } from "@/lib/incident-query";
import { mockIncidents } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Incidents" };

interface IncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const initialQuery = parseIncidentQuery(await searchParams);
  const organization = mockIncidents[0]?.repositoryOwner ?? "your organization";

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em]">Incidents</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Every secret Revokr has found in {organization}&apos;s repositories.
        </p>
      </header>
      {/* Keyed by the query so a search from the sidebar resets the view even on this page. */}
      <IncidentsView
        key={toSearchParams(initialQuery).toString()}
        incidents={mockIncidents}
        initialQuery={initialQuery}
      />
    </div>
  );
}
