import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Btn, Card, PageHeader } from "@/components/ds/primitives";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SimulationCard } from "@/components/settings/simulation-card";
import { getSession, type SessionMode } from "@/lib/session";
import { getSimulationMode } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

const SIGNED_IN_WITH: Record<SessionMode, string> = {
  github: "signed in with GitHub",
  google: "signed in with Google",
  demo: "demo session",
};

export default async function SettingsPage() {
  const [session, simulation] = await Promise.all([getSession(), getSimulationMode()]);
  const identity = session
    ? [
        session.mode === "demo" ? (session.user.name ?? session.user.login) : session.user.login,
        SIGNED_IN_WITH[session.mode],
        session.user.email,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Settings" title="Settings" />

      {/* Two columns on a wide screen so the cards fill the page instead of stretching into bars. */}
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <SimulationCard initial={simulation} />
        <NotificationsCard />

        <Card as="section" aria-labelledby="account-heading" className="flex flex-wrap items-center gap-3.5 p-5">
          <div className="flex min-w-[220px] flex-1 flex-col gap-[5px]">
            <h2 id="account-heading" className="m-0 text-[14px] font-medium">
              Account
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">{identity}</span>
            <span className="text-[12px] text-muted-foreground">
              Identity comes from GitHub or Google. Revokr stores no password.
            </span>
          </div>
          <form action="/api/auth/logout" method="post">
            <Btn type="submit" title="Sign out" className="px-3">
              <LogOut aria-hidden className="size-4" />
              <span className="sr-only">Sign out</span>
            </Btn>
          </form>
        </Card>

        <Card as="section" aria-labelledby="data-heading" className="flex flex-col gap-2 p-5">
          <h2 id="data-heading" className="m-0 text-[14px] font-medium">
            Data handling
          </h2>
          <span className="text-[13px] leading-[1.65] text-muted-foreground">
            Raw secret values are never stored, never logged and never shown in this product. Revokr keeps a
            SHA-256 fingerprint and a masked value (for example AKIA••••7QXM) so you can identify the credential
            without exposing it. Detection metadata and audit entries are retained; secret material is not.
          </span>
        </Card>
      </div>
    </div>
  );
}
