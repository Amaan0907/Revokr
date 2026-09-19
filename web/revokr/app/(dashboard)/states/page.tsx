import type { Metadata } from "next";
import { Btn, Eyebrow, PageHeader, Skeleton } from "@/components/ds/primitives";
import { ApiUnreachable } from "@/components/states/api-unreachable";
import { StateCard } from "@/components/states/state-card";

export const metadata: Metadata = { title: "System states" };

// A reference for the states every page shares, built from the same components the real screens
// use, so a change here is a change everywhere.
export default function StatesPage() {
  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        eyebrow="System states"
        title="The states every page shares"
        description="Loading and API-unreachable replace a screen's content. The rest appear inline where they happen and read the same everywhere."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] items-start gap-4">
        <StateCard
          tone="approval"
          eyebrow="Session expired"
          title="You were signed out"
          actions={<Btn variant="primary" size="sm">Sign in again</Btn>}
        >
          Your session ended after 7 days. Any approval you were about to give was not submitted.
        </StateCard>

        <StateCard
          tone="failed"
          eyebrow="403 · not permitted"
          title="You can view this incident, not approve it"
          actions={<Btn size="sm">Request approver role</Btn>}
        >
          Approval is limited to approvers on the installation. Ask an approver, or request the role.
        </StateCard>

        <StateCard
          tone="unsupported"
          eyebrow="404 · not found"
          title="No incident with that id"
          actions={<Btn size="sm">Back to incidents</Btn>}
        >
          It may belong to another installation, or the link is stale. Incidents are never deleted.
        </StateCard>

        <StateCard
          tone="resolved"
          eyebrow="Zero data · incidents"
          title="No incidents. That’s the good outcome."
          actions={<Btn size="sm">Try simulation</Btn>}
        >
          3 repositories monitored, last push 12 minutes ago, nothing matched.
        </StateCard>

        <StateCard tone="progress" eyebrow="Partial failure" title="Analysis unavailable">
          One panel failing never blanks the page. The analyst panel falls back to the deterministic template;
          risk, actions and audit still render.
        </StateCard>

        <StateCard tone="muted" eyebrow="Row-level loading">
          <div className="mb-2.5 flex w-full flex-col gap-[9px]" aria-hidden>
            <Skeleton className="h-2.5 bg-white/7" />
            <Skeleton className="h-2.5 w-[70%] bg-white/7" style={{ animationDelay: ".2s" }} />
            <Skeleton className="h-2.5 w-[45%] bg-white/7" style={{ animationDelay: ".35s" }} />
          </div>
          In-progress actions refresh every few seconds and update the row only — the page never re-flashes a
          skeleton.
        </StateCard>
      </div>

      <section aria-labelledby="unreachable-heading" className="flex flex-col gap-3">
        <Eyebrow id="unreachable-heading">API unreachable</Eyebrow>
        <ApiUnreachable />
      </section>
    </div>
  );
}
