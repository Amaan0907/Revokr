import type { Metadata } from "next";
import { IncidentsView } from "@/components/incidents/incidents-view";
import { parseIncidentQuery } from "@/lib/incident-query";
import { mockIncidents } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Incidents" };

interface IncidentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const initialQuery = parseIncidentQuery(await searchParams);
  const organization = mockIncidents[0]?.repositoryOwner ?? "your organization";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Incidents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every secret Revokr has found in {organization}&apos;s repositories.
        </p>
      </header>
      <IncidentsView incidents={mockIncidents} initialQuery={initialQuery} />
    </div>
  );
}
