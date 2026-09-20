import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/primitives";
import { FirstRunOverview } from "@/components/onboarding/first-run-overview";
import { Projects } from "@/components/overview/projects";
import { getProjects, getSetupContext } from "@/lib/data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

// Just the projects. What is happening inside each one (incidents, approvals, activity) is on that
// project's own page, so nothing here mixes them together.
export default async function OverviewPage() {
  const session = await getSession();
  const [setup, projects] = await Promise.all([getSetupContext(), getProjects()]);
  const firstName = (session?.user.name ?? session?.user.login ?? "").split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={`Overview${firstName ? ` · welcome back, ${firstName}` : ""}`}
        title="Your projects"
        description="Open a project to see its incidents and where each one is in remediation."
      />

      <Projects projects={projects} />

      {/* Nothing connected yet: the setup checklist, so the page isn't just one empty card. */}
      {projects.length === 0 && <FirstRunOverview installation={setup.installation} />}
    </div>
  );
}
