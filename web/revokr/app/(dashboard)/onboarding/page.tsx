import type { Metadata } from "next";
import { btn, Card, Eyebrow, PageHeader } from "@/components/ds/primitives";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { StateCard } from "@/components/states/state-card";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import { mockInstallation, mockRepositories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Getting started" };

interface OnboardingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}


// Where GitHub sends you back after installing the app. If it comes back with an error, or without
// an installation, this same page says so instead of pretending it worked.
export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const failed = Boolean((await searchParams).error);
  const installation = mockInstallation;
  const monitored = mockRepositories.filter((repository) => repository.enabled).length;

  if (failed) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader eyebrow="First run" title="We couldn't confirm the installation" />
        <StateCard
          tone="failed"
          eyebrow="Callback failed"
          title="GitHub returned without an installation"
          actions={
            <a href={GITHUB_APP_INSTALL_URL} className={btn({ variant: "primary" })}>
              Retry install
            </a>
          }
          className="max-w-[560px]"
        >
          If GitHub returns without an installation_id, or the code exchange fails, this page says so.
          Nothing was installed and no repository is being monitored.
        </StateCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="First run" title="Revokr is connected" />

      <Card className="flex flex-wrap items-center gap-3.5 p-[18px]">
        <span
          aria-hidden
          className="flex size-[26px] items-center justify-center rounded-full border border-resolved/50 font-mono text-[13px] text-resolved"
        >
          ✓
        </span>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-[14px] font-medium">GitHub App installed on {installation.organization}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            installation_id {installation.installationId} · @{installation.installedBy} · webhook receiving pushes
          </span>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SetupChecklist installation={installation} monitored={monitored} />

        <Card as="section" aria-labelledby="next-heading" className="flex flex-col gap-2.5 p-5">
          <Eyebrow id="next-heading">What happens next</Eyebrow>
          <span className="text-[12px] leading-[1.6] text-muted-foreground">
            On the next push to a monitored repo: detect → validate → risk score → ask you to approve. No
            credential changes before approval.
          </span>
          <span className="text-[12px] leading-[1.6] text-muted-foreground">
            Raw secret values are never stored, logged or displayed — only a fingerprint and a masked value
            like <span className="font-mono text-[#f5f5f7]">AKIA••••7QXM</span>.
          </span>
        </Card>
      </div>
    </div>
  );
}
