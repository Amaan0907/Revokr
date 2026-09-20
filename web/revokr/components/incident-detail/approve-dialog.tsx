"use client";

import { Btn, Eyebrow } from "@/components/ds/primitives";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ds/dialog";
import { ACTION_META, actionsSecretNames, REMEDIATION_PLAN } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";

interface ApproveDialogProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function SecretList({ names }: { names: string[] }) {
  return names.map((name, i) => (
    <span key={name}>
      <span className="font-mono text-[#f5f5f7]">{name}</span>
      {i < names.length - 2 ? ", " : i === names.length - 2 ? " and " : ""}
    </span>
  ));
}

// Approving changes live credentials, so it always goes through one more screen that says exactly
// what will happen, in order, before anything runs.
export function ApproveDialog({ incident, open, onOpenChange, onConfirm }: ApproveDialogProps) {
  const repository = `${incident.repositoryOwner}/${incident.repositoryName}`;
  const secrets = actionsSecretNames(incident.provider);
  // Validation already ran before the approval gate; these are the steps approval unlocks.
  const steps = REMEDIATION_PLAN.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Eyebrow>Confirm approval</Eyebrow>
        <DialogTitle>Approve rotation for {incident.maskedValue}?</DialogTitle>
        <DialogDescription>Here is exactly what Revokr will do, in this order:</DialogDescription>

        <ol className="m-0 flex list-none flex-col gap-[7px] p-0">
          {steps.map((type, i) => (
            <li key={type} className="flex items-baseline gap-[9px]">
              <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
              <span className="text-[12px] leading-[1.5]">{ACTION_META[type].label}</span>
            </li>
          ))}
        </ol>

        <span className="text-[12px] leading-[1.6] text-muted-foreground">
          {secrets.length > 0 ? (
            <>
              The new credential is written to the <SecretList names={secrets} /> Actions{" "}
              {secrets.length > 1 ? "secrets" : "secret"} in {repository}.
            </>
          ) : (
            <>The new credential is written to the Actions secret in {repository}.</>
          )}{" "}
          The leaked credential stays active until the replacement is verified. Nothing here removes the
          secret from git history.
        </span>

        {incident.simulated && (
          <span className="text-[12px] leading-[1.6] text-simulation">
            Simulation: approving plays these steps without touching any real credential.
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Approve rotation
          </Btn>
          <Btn size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
