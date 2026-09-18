import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { STATUS_META } from "@/lib/incident-meta";
import { mockIncidents } from "@/lib/mock-data";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const needsAttention = mockIncidents.filter(
    (incident) => STATUS_META[incident.status].group === "attention",
  ).length;
  const repositoryCount = new Set(mockIncidents.map((incident) => incident.repositoryId)).size;
  const simulation = mockIncidents.some((incident) => incident.simulated);
  const organization = mockIncidents[0]?.repositoryOwner ?? "";

  return (
    <AppShell
      user={session.user}
      mode={session.mode}
      organization={organization}
      repositoryCount={repositoryCount}
      needsAttention={needsAttention}
      simulation={simulation}
    >
      {children}
    </AppShell>
  );
}
