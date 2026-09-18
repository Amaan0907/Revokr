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
} from "@/lib/types";

interface LiveIncident {
  status: IncidentStatus;
  actions: RemediationAction[];
  auditLog: AuditLogEntry[];
  running: boolean;
  approve: () => void;
  deny: () => void;
}

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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

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
    const runStep = async (type: ActionType, ms: number) => {
      setStep(type, "RUNNING");
      await wait(ms);
      setStep(type, "SUCCEEDED");
    };

    setRunning(true);
    try {
      log("approved", "success", operator);
      setStatus("ROTATING");
      await wait(500);

      await runStep("ROTATE_CREDENTIAL", 1400);
      log("key_created", "success", adapter, { newKey: maskedReplacement(incident.maskedValue) });

      await runStep("UPDATE_GITHUB_SECRET", 1200);
      log("gh_secret_updated", "success", "github-adapter", {
        repository: `${incident.repositoryOwner}/${incident.repositoryName}`,
      });

      await runStep("DISABLE_OLD_CREDENTIAL", 1200);
      log("old_key_disabled", "success", adapter);
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

  return (
    <LiveIncidentContext.Provider
      value={{ status, actions, auditLog, running, approve: () => void approve(), deny }}
    >
      {children}
    </LiveIncidentContext.Provider>
  );
}
