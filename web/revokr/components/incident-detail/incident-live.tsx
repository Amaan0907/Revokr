"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ActionStatus,
  ActionType,
  AuditAction,
  AuditLogEntry,
  AuditResult,
  IncidentDetail,
  IncidentProgress,
  IncidentStatus,
  RemediationAction,
  Resolution,
} from "@/lib/types";

// "api": the incident is real, every change goes through the Go API and what's shown is what the API
// recorded. "sample": the built-in sample data, where an approval is played on timers with no backend.
export type LiveSource = "api" | "sample";

interface LiveIncident {
  source: LiveSource;
  status: IncidentStatus;
  actions: RemediationAction[];
  auditLog: AuditLogEntry[];
  resolvedAt: string | null;
  running: boolean;
  // Why the last approve or deny didn't go through, if it didn't.
  error: string | null;
  // Set once someone closes an incident Revokr didn't rotate itself.
  resolution: Resolution | null;
  approve: () => void;
  deny: () => void;
  // A failed step goes back to waiting, and the rotation needs approving again. Sample data only:
  // the API has no transition out of FAILED, so on real data there is nothing to call.
  retry: () => void;
  // Also sample data only, for the same reason.
  markHandled: (resolution: Resolution) => void;
}

// Statuses where Revokr has stopped and it's now up to a person.
const HANDOFF: IncidentStatus[] = ["FAILED", "REQUIRES_USER_ACTION", "NOT_SUPPORTED"];

// Statuses in which a rotation is running, so the page keeps polling even if it didn't start it.
const ROTATION_RUNNING: IncidentStatus[] = ["ROTATING", "VERIFYING"];

const POLL_MS = 1200;

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

async function messageFrom(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? "The request didn't go through.";
}

interface LiveIncidentProviderProps {
  detail: IncidentDetail;
  operator: string;
  source: LiveSource;
  children: ReactNode;
}

// Holds the incident's state on the page so an approval can play through every section at once.
export function LiveIncidentProvider({ detail, operator, source, children }: LiveIncidentProviderProps) {
  const { incident } = detail;
  const [status, setStatus] = useState(incident.status);
  const [actions, setActions] = useState(detail.actions);
  const [auditLog, setAuditLog] = useState(detail.auditLog);
  const [resolvedAt, setResolvedAt] = useState(incident.resolvedAt);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshSeq = useRef(0);
  // The timers below outlive the render they started in, so they read the latest steps from here.
  const actionsRef = useRef(actions);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // Reads the incident, its actions and its audit log back from the API. Never the analysis.
  const refresh = useCallback(async () => {
    const seq = ++refreshSeq.current;
    try {
      const response = await fetch(`/api/incidents/${incident.id}/progress`, { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as IncidentProgress;
      // Only the newest request counts, so a slow poll can't overwrite the refetch after it.
      if (seq !== refreshSeq.current) return;
      setStatus(next.incident.status);
      setActions(next.actions);
      setAuditLog(next.auditLog);
      setResolvedAt(next.incident.resolvedAt);
    } catch {
      // The next poll, or the refetch once the request settles, tries again.
    }
  }, [incident.id]);

  // A rotation this page didn't start (someone else approved, or the page was reloaded mid-run).
  useEffect(() => {
    if (source !== "api" || running || !ROTATION_RUNNING.includes(status)) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [source, running, status, refresh]);

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

  // Real approve and deny. Each is one POST to a route handler, which checks the session and forwards
  // it to the API; nothing is changed here until the API has recorded it and the page reads it back.
  const decide = async (kind: "approve" | "deny") => {
    if (status !== "AWAITING_APPROVAL" || running) return;

    setRunning(true);
    setError(null);
    // The API runs the whole rotation inside the approve request, so progress can only be shown by
    // reading the incident's rows while that request is still open.
    if (kind === "approve") pollRef.current = setInterval(() => void refresh(), POLL_MS);
    try {
      const response = await fetch(`/api/incidents/${incident.id}/${kind}`, { method: "POST" });
      if (!response.ok) setError(await messageFrom(response));
    } catch {
      setError("Couldn't reach the dashboard server. The page is showing whatever was recorded.");
    } finally {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      // Refetch once it settles, failures included: a failed rotation is already recorded as FAILED.
      await refresh();
      setRunning(false);
    }
  };

  const approveSample = async () => {
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
    } catch (failure) {
      if (!controller.signal.aborted) throw failure;
    } finally {
      setRunning(false);
    }
  };

  const denySample = () => {
    if (status !== "AWAITING_APPROVAL" || running) return;
    log("denied", "success", operator);
    setStatus("REQUIRES_USER_ACTION");
  };

  const retry = () => {
    if (source === "api" || status !== "FAILED" || running) return;
    setActions((rows) =>
      rows.map((row) =>
        row.status === "FAILED" ? { ...row, status: "PENDING", error: null, startedAt: null, completedAt: null } : row,
      ),
    );
    log("auth_requested", "pending", "approval-gate");
    setStatus("AWAITING_APPROVAL");
  };

  const markHandled = (kind: Resolution) => {
    if (source === "api" || !HANDOFF.includes(status) || running) return;
    log("resolved", "success", operator, { resolution: kind });
    setResolution(kind);
    setStatus("RESOLVED");
  };

  return (
    <LiveIncidentContext.Provider
      value={{
        source,
        status,
        actions,
        auditLog,
        resolvedAt,
        running,
        error,
        resolution,
        approve: () => void (source === "api" ? decide("approve") : approveSample()),
        deny: () => (source === "api" ? void decide("deny") : denySample()),
        retry,
        markHandled,
      }}
    >
      {children}
    </LiveIncidentContext.Provider>
  );
}
