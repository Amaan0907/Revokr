"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ActionStatus,
  ActionType,
  AuditAction,
  AuditLogEntry,
  AuditResult,
  IncidentDetail,
  IncidentStatus,
  RemediationAction,
  Resolution,
} from "@/lib/types";

interface LiveIncident {
  status: IncidentStatus;
  actions: RemediationAction[];
  auditLog: AuditLogEntry[];
  running: boolean;
  // Set once someone closes an incident Revokr didn't rotate itself.
  resolution: Resolution | null;
  approve: () => void;
  deny: () => void;
  // A failed step goes back to waiting, and the rotation needs approving again.
  retry: () => void;
  markHandled: (resolution: Resolution) => void;
}

// Statuses where Revokr has stopped and it's now up to a person.
const HANDOFF: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION", "NOT_SUPPORTED"];

const LiveIncidentContext = createContext<LiveIncident | null>(null);

export function useLiveIncident(): LiveIncident {
  const context = useContext(LiveIncidentContext);
  if (!context) throw new Error("useLiveIncident must be used inside LiveIncidentProvider");
  return context;
}

const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function maskedReplacement(masked: string) {
  const prefix = masked.split("•")[0];
  const suffix = Array.from(
    { length: 4 },
    () => SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)],
  ).join("");
  return `${prefix}••••••••••••${suffix}`;
}

interface LiveIncidentProviderProps {
  detail: IncidentDetail;
  operator: string;
  children: ReactNode;
}

// Holds the incident's state on the page so an approval can play through every section at once.
// For simulated incidents the steps run on timers here; nothing leaves the browser.
export function LiveIncidentProvider({ detail, operator, children }: LiveIncidentProviderProps) {
  const { incident } = detail;
  const [status, setStatus] = useState(incident.status);
  const [actions, setActions] = useState(detail.actions);
  const [auditLog, setAuditLog] = useState(detail.auditLog);
  const [running, setRunning] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The timers below outlive the render they started in, so they read the latest steps from here.
  const actionsRef = useRef(actions);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const log = (
    action: AuditAction,
    result: AuditResult,
    actor: string,
    metadata: Record<string, unknown> | null = null,
  ) =>
    setAuditLog((entries) => [
      ...entries,
      {
        id: `${incident.id}-live-${entries.length + 1}`,
        incidentId: incident.id,
        actor,
        action,
        result,
        metadata,
        timestamp: new Date().toISOString(),
      },
    ]);

  const setStep = (type: ActionType, stepStatus: ActionStatus) =>
    setActions((rows) =>
      rows.map((row) => {
        if (row.actionType !== type) return row;
        const now = new Date().toISOString();
        return {
          ...row,
          status: stepStatus,
          startedAt: stepStatus === "RUNNING" ? now : row.startedAt,
          completedAt: stepStatus === "SUCCEEDED" || stepStatus === "FAILED" ? now : row.completedAt,
        };
      }),
    );

  const approve = async () => {
    if (!incident.simulated || status !== "AWAITING_APPROVAL" || running) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        controller.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(controller.signal.reason);
          },
          { once: true },
        );
      });

    const adapter = `${incident.provider}-adapter`;
    // Returns false when the step had already succeeded, as on a retry, so it isn't run or logged twice.
    const runStep = async (type: ActionType, ms: number) => {
      if (actionsRef.current.find((row) => row.actionType === type)?.status === "SUCCEEDED") return false;
      setStep(type, "RUNNING");
      await wait(ms);
      setStep(type, "SUCCEEDED");
      return true;
    };

    setRunning(true);
    try {
      log("approved", "success", operator);
      setStatus("ROTATING");
      await wait(500);

      if (await runStep("ROTATE_CREDENTIAL", 1400)) {
        log("key_created", "success", adapter, { newKey: maskedReplacement(incident.maskedValue) });
      }

      if (await runStep("UPDATE_GITHUB_SECRET", 1200)) {
        log("gh_secret_updated", "success", "github-adapter", {
          repository: `${incident.repositoryOwner}/${incident.repositoryName}`,
        });
      }

      if (await runStep("DISABLE_OLD_CREDENTIAL", 1200)) log("old_key_disabled", "success", adapter);
      setStatus("VERIFYING");
      await wait(1500);
      log("verified", "success", "verifier");

      await runStep("SEND_NOTIFICATION", 800);
      log("resolved", "success", "revokr");
      setStatus("RESOLVED");
    } catch (error) {
      if (!controller.signal.aborted) throw error;
    } finally {
      setRunning(false);
    }
  };

  const deny = () => {
    if (status !== "AWAITING_APPROVAL" || running) return;
    log("denied", "success", operator);
    setStatus("REQUIRES_USER_ACTION");
  };

  const retry = () => {
    if (status !== "FAILED" || running) return;
    setActions((rows) =>
      rows.map((row) =>
        row.status === "FAILED" ? { ...row, status: "PENDING", error: null, startedAt: null, completedAt: null } : row,
      ),
    );
    log("auth_requested", "pending", "approval-gate");
    setStatus("AWAITING_APPROVAL");
  };

  const markHandled = (kind: Resolution) => {
    if (!HANDOFF.includes(status) || running) return;
    log("resolved", "success", operator, { resolution: kind });
    setResolution(kind);
    setStatus("RESOLVED");
  };

  return (
    <LiveIncidentContext.Provider
      value={{
        status,
        actions,
        auditLog,
        running,
        resolution,
        approve: () => void approve(),
        deny,
        retry,
        markHandled,
      }}
    >
      {children}
    </LiveIncidentContext.Provider>
  );
}
