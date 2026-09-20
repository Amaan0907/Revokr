import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getIncidents } from "@/lib/data";
import { STATUS_META } from "@/lib/incident-meta";
import { getSession } from "@/lib/session";
import type { Incident } from "@/lib/types";
import { getSimulationMode } from "@/lib/settings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // The proxy already sent anyone without a cookie to sign in, so a missing session here means the
  // cookie was present but has expired.
  if (!session) redirect("/login?reason=expired");

  // error.tsx can't catch an error thrown by this layout, so a failed fetch leaves the badge empty
  // here and the page's own fetch shows the error inside the shell.
  let incidents: Incident[] = [];
  try {
    incidents = await getIncidents();
  } catch {}

  const needsAttention = incidents.filter(
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
