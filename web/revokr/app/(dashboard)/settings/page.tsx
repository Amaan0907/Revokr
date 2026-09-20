import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Btn, Card, PageHeader } from "@/components/ds/primitives";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SimulationCard } from "@/components/settings/simulation-card";
import { getSession, type SessionMode } from "@/lib/session";
import { getSimulationMode } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

const SIGNED_IN_WITH: Record<SessionMode, string> = {
  github: "Signed in with GitHub",
  google: "Signed in with Google",
  demo: "Demo session",
};

const DELETE_ERRORS: Record<string, string> = {
  delete_confirm: "What you typed didn't match, so nothing was deleted.",
  delete_failed: "Your account couldn't be deleted right now, so nothing was changed. Try again in a moment.",
  delete_demo: "The demo session has no account to delete.",
};

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { error } = await searchParams;
  const deleteError = typeof error === "string" ? DELETE_ERRORS[error] : undefined;
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
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <PageHeader eyebrow="Settings" title="Settings" />

      {deleteError && (
        <Card role="alert" className="border-[#b8625c]/40 p-4 text-[13px] text-[#b8625c]">
          {deleteError}
        </Card>
      )}

      {/* One column of cards, centred on the page. */}
      <div className="flex flex-col gap-5">
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
            without exposing it. Detection metadata and audit entries are retained until you delete your account; secret material never is.
          </span>
        </Card>

        {session && session.mode !== "demo" && (
          <DeleteAccountCard login={session.user.login} mode={session.mode} />
        )}
      </div>
    </div>
  );
}
