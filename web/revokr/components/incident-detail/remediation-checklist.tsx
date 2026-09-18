"use client";

import { Fragment, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  Check,
  Hourglass,
  LoaderCircle,
  Minus,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, timeAgo } from "@/lib/format";
import { ACTION_META, PROVIDER_LABEL, REMEDIATION_PLAN } from "@/lib/incident-meta";
import type {
  ActionType,
  AuditLogEntry,
  Incident,
  IncidentStatus,
  RemediationAction,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

type StepState = "done" | "running" | "failed" | "waiting" | "queued" | "skipped";

const STOPPED: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION"];

function stepState(action: RemediationAction | null, status: IncidentStatus): StepState {
  if (action?.status === "SUCCEEDED") return "done";
  if (action?.status === "RUNNING") return "running";
  if (action?.status === "FAILED") return "failed";
  if (STOPPED.includes(status)) return "skipped";
  return status === "AWAITING_APPROVAL" ? "waiting" : "queued";
}

function stepNote(type: ActionType, state: StepState, action: RemediationAction | null) {
  switch (state) {
    case "done":
      return action?.startedAt && action.completedAt
        ? `Done in ${formatDuration(new Date(action.completedAt).getTime() - new Date(action.startedAt).getTime())}`
        : "Done";
    case "running":
      return "In progress";
    case "waiting":
      return "Waiting for approval";
    case "queued":
      return "Queued";
    case "skipped":
      return type === "DISABLE_OLD_CREDENTIAL"
        ? "Not run. Revokr never disables a leaked key until a working replacement exists."
        : "Not run";
    case "failed":
      return null;
  }
}

const INDICATOR: Record<StepState, string> = {
  done: "border-resolved/50 text-resolved",
  running: "border-progress text-progress",
  failed: "border-failed/60 text-failed",
  waiting: "text-muted-foreground",
  queued: "text-muted-foreground",
  skipped: "border-dashed text-muted-foreground",
};

function Indicator({ state, number }: { state: StepState; number: number }) {
  return (
    <span className="relative z-10 grid size-7 shrink-0 place-items-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className={cn(
            "grid size-7 place-items-center rounded-full border bg-card text-xs font-semibold tabular-nums",
            INDICATOR[state],
          )}
        >
          {state === "done" && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
          {state === "running" && <LoaderCircle aria-hidden className="size-3.5 animate-spin" />}
          {state === "failed" && <X aria-hidden className="size-3.5" strokeWidth={3} />}
          {state === "skipped" && <Minus aria-hidden className="size-3.5" />}
          {(state === "waiting" || state === "queued") && number}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Connector({ solid }: { solid: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute bottom-0 left-3.5 top-7 w-px -translate-x-1/2 transition-colors duration-500",
        solid ? "bg-resolved/50" : "bg-border",
      )}
    />
  );
}

function ApprovalGate({ incident, decision }: { incident: Incident; decision: AuditLogEntry | undefined }) {
  const { status, approve, deny } = useLiveIncident();
  const [confirmingDeny, setConfirmingDeny] = useState(false);

  if (status === "AWAITING_APPROVAL") {
    return (
      <motion.div
        key="awaiting"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-approval/40 bg-approval/5 p-4"
      >
        <p className="text-sm font-medium text-approval">Approval required</p>
        <p className="mt-1 text-sm text-foreground/80">
          The next steps change live credentials. Revokr will create a replacement{" "}
          {PROVIDER_LABEL[incident.provider]} key, update the GitHub secret, and only then disable
          the leaked key.
        </p>
        {incident.simulated && (
          <p className="mt-2 text-xs text-simulation">
            Simulation: approving plays the steps without touching any real credential.
          </p>
        )}

        {confirmingDeny ? (
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-failed/30 bg-failed/5 p-3">
            <p className="text-sm">
              Denying leaves the leaked key live. Someone will have to rotate it by hand.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" className="rounded-md" onClick={deny}>
                Deny rotation
              </Button>
              <Button variant="ghost" size="sm" className="rounded-md" onClick={() => setConfirmingDeny(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="rounded-md shadow-lg shadow-primary/25" onClick={approve}>
              <Check aria-hidden data-icon="inline-start" />
              Approve rotation
            </Button>
            <Button variant="ghost" className="rounded-md" onClick={() => setConfirmingDeny(true)}>
              Deny
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  if (decision) {
    const approved = decision.action === "approved";
    const Icon = approved ? UserRoundCheck : UserRoundX;
    return (
      <motion.p
        key="decided"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center gap-x-1.5 text-sm"
      >
        <Icon aria-hidden className={cn("size-4", approved ? "text-progress" : "text-failed")} />
        <span className="font-medium">{approved ? "Approved" : "Denied"}</span>
        <span className="text-muted-foreground">
          by <span className="font-mono">{decision.actor}</span> ·{" "}
          <time dateTime={decision.timestamp} suppressHydrationWarning>
            {timeAgo(decision.timestamp)}
          </time>
        </span>
      </motion.p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Approval</span> is requested once the key is
      confirmed live.
    </p>
  );
}

export function RemediationChecklist({ incident }: { incident: Incident }) {
  const { status, actions, auditLog } = useLiveIncident();

  if (status === "NOT_SUPPORTED") {
    return (
      <section aria-labelledby="remediation-heading" className="rounded-xl border bg-card p-5">
        <h2 id="remediation-heading" className="text-sm font-semibold">
          Remediation
        </h2>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed p-4">
          <Ban aria-hidden className="mt-0.5 size-4 shrink-0 text-unsupported" />
          <p className="text-sm text-muted-foreground">
            Revokr can&apos;t validate or rotate this kind of secret. If it&apos;s a real credential,
            rotate it with its provider and remove it from the repository.
          </p>
        </div>
      </section>
    );
  }

  const steps = REMEDIATION_PLAN.map((type) => {
    const action = actions.find((row) => row.actionType === type) ?? null;
    return { type, action, state: stepState(action, status) };
  });
  const doneCount = steps.filter((step) => step.state === "done").length;
  const decision = [...auditLog]
    .reverse()
    .find((entry) => entry.action === "approved" || entry.action === "denied");

  return (
    <section aria-labelledby="remediation-heading" className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="remediation-heading" className="text-sm font-semibold">
            Remediation
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Steps run in this order. The leaked key is never disabled before its replacement is
            verified.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
            {doneCount} of {steps.length} done
          </span>
          <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full origin-left bg-resolved transition-transform duration-700 ease-out"
              style={{ transform: `scaleX(${doneCount / steps.length})` }}
            />
          </span>
        </div>
      </div>

      <AnimatePresence>
        {status === "RESOLVED" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <p className="mt-4 flex items-start gap-3 rounded-lg border border-resolved/30 bg-resolved/10 px-4 py-3 text-sm">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-resolved" />
              <span>
                <span className="font-medium text-resolved">All steps completed.</span>{" "}
                <span className="text-foreground/80">
                  The replacement is in place and the leaked key is confirmed dead.
                </span>
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ol className="mt-5 flex flex-col">
        {steps.map(({ type, action, state }, i) => {
          const note = stepNote(type, state, action);
          const muted = state === "queued" || state === "waiting" || state === "skipped";
          return (
            <Fragment key={type}>
              <li className="relative flex gap-3 pb-5 last:pb-0">
                {i < steps.length - 1 && <Connector solid={state === "done"} />}
                <Indicator state={state} number={i + 1} />
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-md pt-0.5 transition-colors",
                    state === "running" && "-mx-2 -mt-1 bg-progress/5 px-2 pb-1 pt-1.5",
                  )}
                >
                  <p className={cn("text-sm font-medium", muted && "text-muted-foreground")}>
                    {ACTION_META[type].label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ACTION_META[type].description}
                  </p>
                  {note && (
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        state === "done" && "text-resolved",
                        state === "running" && "text-progress",
                        muted && "text-muted-foreground",
                      )}
                    >
                      {note}
                    </p>
                  )}
                  {state === "failed" && action?.error && (
                    <p className="mt-2 rounded-md border border-failed/30 bg-failed/5 px-3 py-2 text-xs text-failed">
                      {action.error}
                    </p>
                  )}
                </div>
              </li>

              {i === 0 && (
                <li className="relative flex gap-3 pb-5">
                  <Connector solid={decision?.action === "approved"} />
                  <span
                    className={cn(
                      "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border bg-card transition-colors",
                      status === "AWAITING_APPROVAL"
                        ? "border-approval/60 text-approval"
                        : decision?.action === "approved"
                          ? "border-progress/50 text-progress"
                          : decision?.action === "denied"
                            ? "border-failed/60 text-failed"
                            : "text-muted-foreground",
                    )}
                  >
                    <Hourglass aria-hidden className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <ApprovalGate incident={incident} decision={decision} />
                  </div>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}
