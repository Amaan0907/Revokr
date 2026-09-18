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
  done: "bg-resolved text-black",
  running: "bg-progress/15 text-progress ring-1 ring-inset ring-progress/50",
  failed: "bg-failed text-white",
  waiting: "text-muted-foreground ring-1 ring-inset ring-white/15",
  queued: "text-muted-foreground ring-1 ring-inset ring-white/15",
  skipped: "border border-dashed border-white/20 text-muted-foreground",
};

function Indicator({ state, number }: { state: StepState; number: number }) {
  return (
    <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.04]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className={cn(
            "grid size-8 place-items-center rounded-full text-xs font-semibold tabular-nums",
            INDICATOR[state],
          )}
        >
          {state === "done" && <Check aria-hidden className="size-4" strokeWidth={3} />}
          {state === "running" && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {state === "failed" && <X aria-hidden className="size-4" strokeWidth={3} />}
          {state === "skipped" && <Minus aria-hidden className="size-4" />}
          {(state === "waiting" || state === "queued") && number}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Connector({ solid }: { solid: boolean }) {
  return (
    <span aria-hidden className="absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-white/[0.08]">
      <span
        className={cn(
          "block h-full w-full origin-top bg-resolved/70 transition-transform duration-700 ease-out",
          solid ? "scale-y-100" : "scale-y-0",
        )}
      />
    </span>
  );
}

function ApprovalGate({ incident, decision }: { incident: Incident; decision: AuditLogEntry | undefined }) {
  const { status, approve, deny } = useLiveIncident();
  const [confirmingDeny, setConfirmingDeny] = useState(false);

  if (status === "AWAITING_APPROVAL") {
    return (
      <motion.div
        key="awaiting"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-approval/[0.07] p-5 ring-1 ring-inset ring-approval/25"
      >
        <p className="text-[15px] font-semibold text-approval">Approval required</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          The next steps change live credentials. Revokr will create a replacement{" "}
          {PROVIDER_LABEL[incident.provider]} key, update the GitHub secret, and only then disable
          the leaked key.
        </p>
        {incident.simulated && (
          <p className="mt-2 text-xs text-simulation">
            Simulation: approving plays the steps without touching any real credential.
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {confirmingDeny ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex flex-col gap-3 rounded-xl bg-failed/10 p-4 ring-1 ring-inset ring-failed/25"
            >
              <p className="text-sm">
                Denying leaves the leaked key live. Someone will have to rotate it by hand.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" size="sm" onClick={deny}>
                  Deny rotation
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDeny(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex flex-wrap gap-2.5"
            >
              <Button size="lg" onClick={approve}>
                <Check aria-hidden data-icon="inline-start" strokeWidth={2.5} />
                Approve rotation
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setConfirmingDeny(true)}>
                Deny
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
        className="flex flex-wrap items-center gap-x-1.5 pt-1 text-sm"
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
    <p className="pt-1 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Approval</span> is requested once the key is
      confirmed live.
    </p>
  );
}

export function RemediationChecklist({ incident }: { incident: Incident }) {
  const { status, actions, auditLog } = useLiveIncident();

  if (status === "NOT_SUPPORTED") {
    return (
      <section aria-labelledby="remediation-heading" className="surface rounded-3xl p-6 sm:p-7">
        <h2 id="remediation-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
          Remediation
        </h2>
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white/[0.04] p-4">
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
    <section
      aria-labelledby="remediation-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:120ms] sm:p-7"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="remediation-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
            Remediation
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Steps run in this order. The leaked key is never disabled before its replacement is
            verified.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span aria-live="polite" className="text-[13px] tabular-nums text-muted-foreground">
            {doneCount} of {steps.length}
          </span>
          <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.08]">
            <span
              className="block h-full origin-left rounded-full bg-resolved transition-transform duration-700 ease-out"
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
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-5 flex items-start gap-3 rounded-2xl bg-resolved/10 px-4 py-3.5 text-sm ring-1 ring-inset ring-resolved/25">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-resolved" />
              <span>
                <span className="font-semibold text-resolved">All steps completed.</span>{" "}
                <span className="text-foreground/80">
                  The replacement is in place and the leaked key is confirmed dead.
                </span>
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ol className="mt-6 flex flex-col">
        {steps.map(({ type, action, state }, i) => {
          const note = stepNote(type, state, action);
          const muted = state === "queued" || state === "waiting" || state === "skipped";
          return (
            <Fragment key={type}>
              <li className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && <Connector solid={state === "done"} />}
                <Indicator state={state} number={i + 1} />
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-xl pt-1 transition-colors duration-500",
                    state === "running" && "-mx-3 -mt-1.5 bg-progress/[0.08] px-3 pb-2.5 pt-2.5",
                  )}
                >
                  <p className={cn("text-[15px] font-medium", muted && "text-muted-foreground")}>
                    {ACTION_META[type].label}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{ACTION_META[type].description}</p>
                  {note && (
                    <p
                      className={cn(
                        "mt-1.5 text-xs font-medium",
                        state === "done" && "text-resolved",
                        state === "running" && "text-progress",
                        muted && "font-normal text-muted-foreground",
                      )}
                    >
                      {note}
                    </p>
                  )}
                  {state === "failed" && action?.error && (
                    <p className="mt-2 rounded-xl bg-failed/10 px-3 py-2 text-xs text-failed ring-1 ring-inset ring-failed/25">
                      {action.error}
                    </p>
                  )}
                </div>
              </li>

              {i === 0 && (
                <li className="relative flex gap-4 pb-6">
                  <Connector solid={decision?.action === "approved"} />
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.04] ring-1 ring-inset transition-colors duration-500",
                      status === "AWAITING_APPROVAL"
                        ? "bg-approval/15 text-approval ring-approval/50"
                        : decision?.action === "approved"
                          ? "bg-progress/15 text-progress ring-progress/40"
                          : decision?.action === "denied"
                            ? "bg-failed/15 text-failed ring-failed/50"
                            : "text-muted-foreground ring-white/15",
                    )}
                  >
                    <Hourglass aria-hidden className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
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
