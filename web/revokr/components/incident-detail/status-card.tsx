"use client";

import { useState } from "react";
import { Btn, Card, Eyebrow, StatusChip } from "@/components/ds/primitives";
import { formatTime } from "@/lib/format";
import { ACTION_META, manualSteps, PROVIDER_LABEL, SEVERITY_META, STATUS_META } from "@/lib/incident-meta";
import type { ActionType, Incident, IncidentStatus, RemediationAction, Resolution } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ApproveDialog } from "./approve-dialog";
import { useLiveIncident } from "./incident-live";

// What a failed step means for the credential, in plain terms: is it still live, and do deploys work.
const FAILURE_IMPACT: Partial<Record<ActionType, string>> = {
  ROTATE_CREDENTIAL: "No replacement was created and nothing was changed. The leaked credential is still active.",
  UPDATE_GITHUB_SECRET:
    "The replacement exists but the GitHub secret wasn't updated, so deploys still use the leaked credential. Nothing was disabled.",
  DISABLE_OLD_CREDENTIAL:
    "The replacement is live and the GitHub secret was updated, so deploys keep working. The leaked credential is still active — disable it manually, or grant the missing permission and retry.",
};

// A resolved incident normally means Revokr replaced the key and confirmed the old one dead. When a
// person closed it instead, the card must not claim that.
const BY_HAND: Record<Resolution, { head: string; body: string }> = {
  manual: {
    head: "Handled by hand",
    body: "Revokr didn't rotate this credential, so it's up to whoever closed it to have revoked the old one.",
  },
  false_positive: {
    head: "Dismissed as a false positive",
    body: "Nothing was rotated and no credential was changed.",
  },
};

interface Copy {
  head: string;
  body: string;
}

function describe(
  incident: Incident,
  status: IncidentStatus,
  context: { failed?: RemediationAction; denied: boolean; stepCount: number; closedAt: string | null },
): Copy {
  switch (status) {
    case "DETECTED":
      return {
        head: "Secret detected in a push",
        body: `Gitleaks matched a pattern in commit ${incident.commitSha.slice(0, 7)}. Validation is queued; nothing has been changed.`,
      };
    case "VALIDATING":
      return {
        head: "Checking whether the credential is live",
        body: "A read-only identity call decides is_live. No write, no rotation.",
      };
    case "AWAITING_APPROVAL":
      return {
        head: "Waiting for a human to approve rotation",
        body: "Revokr will not create, update or disable anything until an approver says so.",
      };
    case "ROTATING":
      return {
        head: "Rotating in the fixed safe order",
        body: "Replacement created, GitHub secret being updated. The old key is still active on purpose.",
      };
    case "VERIFYING":
      return {
        head: "Verifying the replacement works",
        body: "The old credential is only disabled after this check passes.",
      };
    case "RESOLVED":
      return {
        head: "Closed the loop",
        body: `Replacement verified, old credential disabled${context.closedAt ? ` at ${formatTime(context.closedAt)}Z` : ""}. Full audit trail below.`,
      };
    case "FAILED":
      return {
        head: "Remediation failed — old credential left active",
        body: context.failed ? `Failing action: ${ACTION_META[context.failed.actionType].label}.` : "A remediation step failed.",
      };
    case "REQUIRES_USER_ACTION":
      return {
        head: `Needs ${context.stepCount} manual steps from you`,
        body: context.denied
          ? "Rotation was denied, so the leaked credential stays active until someone handles it."
          : `${PROVIDER_LABEL[incident.provider]} credentials cannot be rotated by Revokr.`,
      };
    case "NOT_SUPPORTED":
      return {
        head: "Automatic remediation not supported",
        body: `${incident.secretType}: Revokr cannot tell which system issued it.`,
      };
  }
}

// Only the sample data can be marked handled: the API has no transition out of these statuses, so on
// real data the page says so rather than pretend to record something it can't.
const NOT_RECORDED = "Recording the outcome of manual steps isn't supported yet. This incident stays as it is in the audit log.";

function ManualSteps({ steps, onHandled }: { steps: string[]; onHandled?: () => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Eyebrow className="tracking-[.14em] text-attention">do this by hand · {steps.length} steps</Eyebrow>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5 rounded-[12px] border border-white/8 px-3.5 py-3">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/16 font-mono text-[10px] text-muted-foreground"
            >
              {i + 1}
            </span>
            <span className="text-[12px] leading-[1.6]">{step}</span>
          </li>
        ))}
      </ol>
      {onHandled ? (
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" onClick={onHandled}>
            Mark as handled
          </Btn>
        </div>
      ) : (
        <span className="font-mono text-[10px] text-muted-foreground">{NOT_RECORDED}</span>
      )}
    </div>
  );
}

// The card that says where the incident stands and what, if anything, is being asked of the person.
// Every state says what Revokr did, what it didn't, and never implies a rotation that didn't happen.
export function StatusCard({ incident }: { incident: Incident }) {
  const { source, status, actions, auditLog, resolvedAt, error, resolution, approve, deny, retry, markHandled } =
    useLiveIncident();
  const recordable = source === "sample";
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const failed = actions.find((action) => action.status === "FAILED");
  const steps = manualSteps(incident);
  const decision = [...auditLog].reverse().find((entry) => entry.action === "approved" || entry.action === "denied");
  const closedAt = [...auditLog].reverse().find((entry) => entry.action === "resolved")?.timestamp ?? resolvedAt;

  const copy = resolution
    ? BY_HAND[resolution]
    : describe(incident, status, {
        failed,
        denied: decision?.action === "denied",
        stepCount: steps.length,
        closedAt,
      });
  const tone = resolution ? "text-resolved" : STATUS_META[status].text;
  const severity = SEVERITY_META[incident.severity];

  return (
    <Card as="section" aria-label="Incident status" className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusChip className={tone}>{status.replaceAll("_", " ")}</StatusChip>
        <span className={cn("font-mono text-[10px] font-medium uppercase tracking-[.12em]", severity.text)}>
          {incident.severity} · risk {incident.riskScore}
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        <span className="text-[17px] font-medium tracking-[-.01em]">{copy.head}</span>
        <span className="text-[13px] leading-[1.6] text-muted-foreground">{copy.body}</span>
      </div>

      {error && (
        <span role="alert" className="text-[12px] leading-[1.6] text-failed">
          {error}
        </span>
      )}

      {decision && status !== "AWAITING_APPROVAL" && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {decision.action} by {decision.actor} · {formatTime(decision.timestamp)}Z
        </span>
      )}

      {status === "AWAITING_APPROVAL" && (
        <div className="flex flex-col gap-2.5">
          {denying ? (
            <div className="flex flex-col gap-2.5 rounded-[14px] border border-failed/35 bg-failed/8 p-3.5">
              <span className="text-[12px] leading-[1.6]">
                Denying leaves the leaked credential active. Someone will have to rotate it by hand.
              </span>
              <div className="flex flex-wrap gap-2">
                <Btn variant="danger" onClick={deny}>
                  Deny rotation
                </Btn>
                <Btn onClick={() => setDenying(false)}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" size="lg" onClick={() => setApproving(true)}>
                Approve rotation
              </Btn>
              <Btn variant="danger" size="lg" onClick={() => setDenying(true)}>
                Deny
              </Btn>
            </div>
          )}
          <ApproveDialog incident={incident} open={approving} onOpenChange={setApproving} onConfirm={approve} />
        </div>
      )}

      {status === "FAILED" && !resolution && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5 rounded-[14px] border border-failed/35 bg-failed/8 p-3.5">
            {failed && (
              <>
                <Eyebrow className="tracking-[.14em] text-failed">
                  failed action · {ACTION_META[failed.actionType].label.toLowerCase()}
                </Eyebrow>
                {failed.error && <span className="font-mono text-[12px] leading-[1.6]">{failed.error}</span>}
              </>
            )}
            <span className="text-[12px] leading-[1.6] text-muted-foreground">
              {(failed && FAILURE_IMPACT[failed.actionType]) ??
                "The leaked credential may still be active. Fix the cause and retry, or handle it by hand."}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recordable && (
              <Btn variant="primary" onClick={retry}>
                Retry this action
              </Btn>
            )}
            <Btn aria-expanded={showManual} onClick={() => setShowManual((open) => !open)}>
              {showManual ? "Hide manual steps" : "Show manual steps"}
            </Btn>
          </div>
          {recordable && (
            <span className="font-mono text-[10px] text-muted-foreground">Retrying needs your approval again.</span>
          )}
          {showManual && <ManualSteps steps={steps} onHandled={recordable ? () => markHandled("manual") : undefined} />}
        </div>
      )}

      {status === "REQUIRES_USER_ACTION" && !resolution && (
        <ManualSteps steps={steps} onHandled={recordable ? () => markHandled("manual") : undefined} />
      )}

      {status === "NOT_SUPPORTED" && !resolution && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5 rounded-[14px] border border-white/10 p-3.5">
            <Eyebrow className="tracking-[.14em] text-unsupported">why not supported</Eyebrow>
            <span className="text-[12px] leading-[1.6] text-muted-foreground">
              The match has no provider signature, so Revokr can&apos;t validate it, can&apos;t create a
              replacement and won&apos;t guess. Detection stands; remediation is yours.
            </span>
            <span className="text-[12px] leading-[1.6] text-muted-foreground">
              By hand: identify the issuing system, rotate it there, update the GitHub Actions secret, then
              revoke the old value and resolve this incident.
            </span>
          </div>
          {recordable ? (
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" onClick={() => markHandled("manual")}>
                Mark as handled
              </Btn>
              <Btn onClick={() => markHandled("false_positive")}>Dismiss as false positive</Btn>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">{NOT_RECORDED}</span>
          )}
        </div>
      )}
    </Card>
  );
}
