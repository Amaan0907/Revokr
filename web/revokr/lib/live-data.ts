// Who sees the real API's data. ADMIN_LOGINS is a comma-separated list of GitHub usernames (or
// Google email addresses). Once it is set, only those accounts see real incidents; everyone else,
// including the demo sign-in, gets the sample data. Left unset, every signed-in account sees real
// data, which is what a single-team deployment wants and what earlier deployments did.
import { apiConfigured } from "./api";
import { getSession, type Session } from "./session";

function parseLogins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

export function canViewLiveData(session: Session | null, adminLogins = process.env.ADMIN_LOGINS): boolean {
  if (!session) return false;
  const allowed = parseLogins(adminLogins);
  if (allowed.length === 0) return true;
  return session.mode !== "demo" && allowed.includes(session.user.login.toLowerCase());
}

// True when this viewer should be shown the Go API's data rather than sample data.
export async function showsLiveData(): Promise<boolean> {
  if (!apiConfigured()) return false;
  return canViewLiveData(await getSession());
}
