// Server-side gate for approve and deny. The browser never calls the Go API: it posts to a Next route
// handler, which checks who is asking and then forwards the decision. The Go API has no authentication
// of its own, so this is the only thing standing between a request and a rotation on the dashboard path.
import { NextResponse, type NextRequest } from "next/server";
import { DECISION_TIMEOUT_MS, ApiError, apiConfigured, apiFetch } from "./api";
import { isSameOrigin } from "./auth-config";
import type { ApiIncident } from "./incident-api";
import { getSession } from "./session";

export type Decision = "approve" | "deny";

interface DecisionResponse {
  new_status?: string;
}

function refuse(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

// The message is fixed text on purpose. What the Go API says can carry provider error details, and
// the page shows what actually happened from the audit log and action rows it refetches afterwards.
const REJECTED = "The API didn't accept this decision. The page is refreshing to show the incident's current state.";
const LOST_CONTACT = "Lost contact with the Revokr API. The page is refreshing to show where the incident stands.";

export async function forwardDecision(request: NextRequest, id: string, decision: Decision) {
  // Cross-origin first: a forged request shouldn't learn anything about whether a session exists.
  if (!isSameOrigin(request)) return refuse(403, "Cross-origin requests aren't allowed.");

  const session = await getSession();
  if (!session) return refuse(401, "Sign in to approve or deny a rotation.");

  if (!apiConfigured()) return refuse(503, "The dashboard isn't connected to a Revokr API.");

  const path = `/api/incidents/${encodeURIComponent(id)}`;

  // The demo sign-in is open to anyone, so it may only act on simulated incidents; a real rotation
  // needs a real sign-in.
  if (session.mode === "demo") {
    try {
      const incident = await apiFetch<ApiIncident>(path);
      if (!incident.simulated) {
        return refuse(403, "The demo session can only act on simulated incidents.");
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return refuse(404, "No such incident.");
      return refuse(502, LOST_CONTACT);
    }
  }

  // Recorded as the audit-log actor, so the trail says who decided, not just "dashboard-user".
  const body =
    decision === "approve"
      ? { actor: session.user.login, metadata: { via: "dashboard" } }
      : { actor: session.user.login };

  try {
    const result = await apiFetch<DecisionResponse>(
      `${path}/${decision}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      DECISION_TIMEOUT_MS,
    );
    return NextResponse.json({ ok: true, status: result.new_status ?? null });
  } catch (error) {
    // A status means the API answered and said no (an invalid transition, or a rotation that
    // failed and is now recorded as FAILED); no status means it never answered.
    if (error instanceof ApiError && error.status !== null) return refuse(error.status, REJECTED);
    return refuse(502, LOST_CONTACT);
  }
}
