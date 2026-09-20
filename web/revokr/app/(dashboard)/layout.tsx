import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { STATUS_META } from "@/lib/incident-meta";
import { mockIncidents } from "@/lib/mock-data";
import { getSession } from "@/lib/session";
import { getSimulationMode } from "@/lib/settings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // The proxy already sent anyone without a cookie to sign in, so a missing session here means the
  // cookie was present but has expired.
  if (!session) redirect("/login?reason=expired");

  const needsAttention = mockIncidents.filter(
    (incident) => STATUS_META[incident.status].group === "attention",
  ).length;

  return (
    <AppShell
      user={session.user}
      mode={session.mode}
      needsAttention={needsAttention}
      simulation={await getSimulationMode()}
    >
      {children}
    </AppShell>
  );
}
