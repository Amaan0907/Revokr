import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { STATUS_META } from "@/lib/incident-meta";
import { mockIncidents } from "@/lib/mock-data";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const needsAttention = mockIncidents.filter(
    (incident) => STATUS_META[incident.status].group === "attention",
  ).length;
  const repositoryCount = new Set(mockIncidents.map((incident) => incident.repositoryId)).size;
  const simulation = mockIncidents.some((incident) => incident.simulated);
  const organization = mockIncidents[0]?.repositoryOwner ?? "";

  return (
    <AppShell
      organization={organization}
      repositoryCount={repositoryCount}
      needsAttention={needsAttention}
      simulation={simulation}
    >
      {children}
    </AppShell>
  );
}
