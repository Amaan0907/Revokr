import Link from "next/link";
import { btn, Card } from "@/components/ds/primitives";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import type { GitHubInstallation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SetupChecklistProps {
  installation: GitHubInstallation | null;
  monitored: number;
  className?: string;
}

interface Step {
  title: string;
  body: string;
  state: "done" | "current" | "todo";
  cta?: { label: string; href: string };
}

function buildSteps({ installation, monitored }: SetupChecklistProps): Step[] {
  const installed = installation !== null;
  const watching = monitored > 0;
  return [
    {
      title: "Install the GitHub App",
      body: installation
        ? `Done for ${installation.organization} · installation_id ${installation.installationId} by @${installation.installedBy}.`
        : "Revokr needs it to receive push webhooks and to write replacement values into Actions secrets.",
      state: installed ? "done" : "current",
      cta: installed ? undefined : { label: "Install GitHub App", href: GITHUB_APP_INSTALL_URL },
    },
    {
      title: "Choose repositories to monitor",
      body: watching
        ? `${monitored} ${monitored === 1 ? "repository is" : "repositories are"} being monitored.`
        : "Opt in per repo. Nothing is scanned until you switch it on.",
      state: watching ? "done" : installed ? "current" : "todo",
      cta: !watching && installed ? { label: "Choose repositories", href: "/repositories" } : undefined,
    },
    {
      title: "Push a test secret, or try simulation",
      body: "See the full loop end to end without touching a real credential.",
      state: watching ? "current" : "todo",
      cta: watching ? { label: "Try simulation", href: "/settings" } : undefined,
    },
  ];
}

// The three things to do before Revokr has anything to say. Shared by the onboarding screen and by the
// overview, which shows it in place of empty stat cards.
export function SetupChecklist({ className, ...props }: SetupChecklistProps) {
  const steps = buildSteps(props);
  const done = steps.filter((step) => step.state === "done").length;

  return (
    <Card as="section" aria-labelledby="setup-heading" className={cn("flex flex-col gap-3.5 p-5", className)}>
      <div className="flex items-baseline gap-2.5">
        <h2 id="setup-heading" className="m-0 text-[14px] font-medium">
          Finish setup
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">{done} of 3 done</span>
      </div>

      <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
        {steps.map((step, i) => (
          <li
            key={step.title}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex gap-3 rounded-[14px] border border-white/8 bg-white/2 p-3.5"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[12px]",
                step.state === "done" && "border-resolved text-resolved",
                step.state === "current" && "border-[#f5f5f7] text-[#f5f5f7]",
                step.state === "todo" && "border-white/16 text-muted-foreground",
              )}
            >
              {step.state === "done" ? "✓" : i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span
                className={cn(
                  "text-[13px] font-medium",
                  step.state === "done" && "text-resolved",
                  step.state === "current" && "text-[#f5f5f7]",
                  step.state === "todo" && "text-muted-foreground",
                )}
              >
                {step.title}
                {step.state === "done" && <span className="sr-only"> (done)</span>}
              </span>
              <span className="text-[12px] leading-[1.55] text-muted-foreground">{step.body}</span>
              {step.cta && (
                <div className="mt-0.5 flex flex-wrap gap-2">
                  <Link href={step.cta.href} className={btn({ variant: "primary", size: "sm" })}>
                    {step.cta.label}
                  </Link>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
