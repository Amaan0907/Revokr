"use client";

import { Card, CardHeader } from "@/components/ds/primitives";
import { REMEDIATION_PLAN } from "@/lib/incident-meta";
import type { ActionType, IncidentStatus, RemediationAction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

const SHORT_LABEL: Record<ActionType, string> = {
  VALIDATE_CREDENTIAL: "Validate leaked key",
  ROTATE_CREDENTIAL: "Create replacement",
  UPDATE_GITHUB_SECRET: "Update GitHub secret",
  DISABLE_OLD_CREDENTIAL: "Disable old credential",
  SEND_NOTIFICATION: "Notify team",
  CLEAN_HISTORY: "Clean history",
};

const STOPPED: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION"];

type StepState = "succeeded" | "running" | "failed" | "pending" | "not run";

const STATE_TONE: Record<StepState, string> = {
  succeeded: "text-resolved",
  running: "text-progress",
  failed: "text-failed",
  pending: "text-muted-foreground",
  "not run": "text-muted-foreground",
};

function stepState(action: RemediationAction | undefined, stopped: boolean): StepState {
  if (action?.status === "SUCCEEDED") return "succeeded";
  if (action?.status === "RUNNING") return "running";
  if (action?.status === "FAILED") return "failed";
  return stopped ? "not run" : "pending";
}

// The sequence every rotation follows, always on screen, so nobody wonders whether the old
// credential could be disabled before its replacement works.
export function RemediationOrder({ initialStatus }: { initialStatus: IncidentStatus }) {
  const { status, actions, resolution } = useLiveIncident();

  // Nothing to run for a secret Revokr can't validate or rotate.
  if (initialStatus === "NOT_SUPPORTED") return null;

  // A resolved incident has nothing left to run: a step with no row was never going to, and calling
  // it "pending" on a closed incident would say otherwise.
  const stopped = STOPPED.includes(status) || status === "RESOLVED" || resolution !== null;

  return (
    <Card as="section" aria-labelledby="order-heading" className="flex flex-col gap-3 p-5">
      <CardHeader
        id="order-heading"
        title="Fixed remediation order"
        description="Always visible, always this sequence. The old credential is never disabled first."
        className="gap-1"
      />
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {REMEDIATION_PLAN.map((type, i) => {
          const state = stepState(
            actions.find((action) => action.actionType === type),
            stopped,
          );
          return (
            <li
              key={type}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border px-[13px] py-[9px]",
                state === "pending" || state === "not run" ? "border-white/10" : "border-white/18",
              )}
            >
              <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
              <span className="text-[12px]">{SHORT_LABEL[type]}</span>
              <span className={cn("font-mono text-[10px] font-medium uppercase tracking-[.1em]", STATE_TONE[state])}>
                {state}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
