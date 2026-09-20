import Link from "next/link";
import { btn } from "@/components/ds/primitives";
import { StateCard } from "@/components/states/state-card";

// The GitHub App is what delivers push webhooks and what writes replacement values into Actions
// secrets, so nothing works before it's installed.
export function InstallGitHubApp() {
  return (
    <StateCard
      size="page"
      eyebrow="GitHub App · not installed"
      title="Revokr needs the GitHub App to watch your repositories"
      actions={
        <>
          <a href="https://github.com/apps/revokr/installations/new" className={btn({ variant: "primary", size: "lg" })}>
            Install GitHub App
          </a>
          <Link href="/settings" className={btn({ size: "lg" })}>
            Try simulation instead
          </Link>
        </>
      }
    >
      Revokr needs the GitHub App to receive push webhooks and to write replacement values into Actions
      secrets. You pick the repositories after installing, never all of them by default.
    </StateCard>
  );
}
