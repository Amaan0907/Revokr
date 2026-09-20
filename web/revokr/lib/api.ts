// Server-side client for the Go API. Only server components and route handlers may import this:
// REVOKR_API_URL has no NEXT_PUBLIC_ prefix on purpose, so the API's address never reaches the browser.

const REQUEST_TIMEOUT_MS = 10_000;

// Approval is one POST during which the API runs the whole rotation. Giving up early would cancel
// the request's context on the Go side and could strand the incident mid-rotation, so it waits.
export const DECISION_TIMEOUT_MS = 120_000;

// The analyst may call a model, which is slower than a database read.
export const ANALYSIS_TIMEOUT_MS = 30_000;

// True when the dashboard is wired to a backend. When it's false the UI runs on sample data; when
// it's true and a request fails, callers must surface the error and never fall back to sample data.
export function apiConfigured(): boolean {
  return Boolean(process.env.REVOKR_API_URL?.trim());
}

// Deliberately carries no URL and no response body: this message can end up on an error page.
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiUrl(path: string): string {
  const base = process.env.REVOKR_API_URL?.trim();
  if (!base) throw new ApiError("REVOKR_API_URL is not set");
  return `${base.replace(/\/+$/, "")}${path}`;
}

// Calls the Go API and returns the parsed JSON body. Never cached: incident status changes under it.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(`Could not reach the Revokr API (${path})`);
  }

  if (!response.ok) {
    throw new ApiError(`The Revokr API returned ${response.status} for ${path}`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(`The Revokr API sent an unreadable response for ${path}`, response.status);
  }
}
