// What a viewer is shown, and who may act on it.
//
//   "live"   the Go API's real incidents and audit log
//   "empty"  a real sign-in that isn't allowed to see the API's data: no incidents, and never
//            sample data, because a real account should not be shown made-up incidents
//   "sample" the built-in sample data, for the demo sign-in and for running with no backend
//
// ADMIN_LOGINS is a comma-separated list of GitHub usernames (or Google email addresses). Left
// unset, every signed-in account sees live data, which is what a single-team deployment wants.
// Once it is set, only those accounts see live data and approve rotations; other GitHub and Google
// accounts get "empty", and the demo sign-in gets "sample".
import { apiConfigured } from "./api";
import { getSession, type Session } from "./session";

export type DataSource = "live" | "empty" | "sample";

function parseLogins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

// Whether this session may read live incidents and act on them.
export function canViewLiveData(session: Session | null, adminLogins = process.env.ADMIN_LOGINS): boolean {
  if (!session) return false;
  const allowed = parseLogins(adminLogins);
  if (allowed.length === 0) return true;
  return session.mode !== "demo" && allowed.includes(session.user.login.toLowerCase());
}

export function dataSourceFor(
  session: Session | null,
  configured: boolean,
  adminLogins = process.env.ADMIN_LOGINS,
): DataSource {
  if (!configured || !session) return "sample";
  if (canViewLiveData(session, adminLogins)) return "live";
  return session.mode === "demo" ? "sample" : "empty";
}

export async function getDataSource(): Promise<DataSource> {
  return dataSourceFor(await getSession(), apiConfigured());
}
