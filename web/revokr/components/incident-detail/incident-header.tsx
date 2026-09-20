import Link from "next/link";
import { Eyebrow, GradientHeading } from "@/components/ds/primitives";
import { formatTime } from "@/lib/format";
import { PROVIDER_LABEL } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";

// Who, where and when: the incident's identity, before anything about what to do with it.
export function IncidentHeader({ incident }: { incident: Incident }) {
  const file = incident.lineNumber === null ? incident.filePath : `${incident.filePath}:${incident.lineNumber}`;
  const fingerprint = `sha256:${incident.fingerprint.slice(0, 4)}…${incident.fingerprint.slice(-4)}`;
  const live = incident.isLive === null ? "unchecked" : String(incident.isLive);

  const facts = [
    incident.maskedValue,
    fingerprint,
    file,
    `commit ${incident.commitSha.slice(0, 7)}`,
    `is_live ${live}`,
    `detected ${formatTime(incident.createdAt)}Z`,
    ...(incident.resolvedAt ? [`resolved ${formatTime(incident.resolvedAt)}Z`] : []),
    ...(incident.simulated ? ["simulated"] : []),
  ];

  return (
    <header className="flex flex-col gap-1.5">
      <Eyebrow>
        <Link href="/incidents" className="hover:text-[#f5f5f7]">
          Incidents
        </Link>{" "}
        / inc_{incident.id.slice(0, 4)} · {PROVIDER_LABEL[incident.provider].toLowerCase()}
      </Eyebrow>
      <GradientHeading className="text-[length:clamp(22px,3vw,30px)]">
        {incident.secretType} in {incident.repositoryOwner}/{incident.repositoryName}
      </GradientHeading>
      <span className="font-mono text-[11px] leading-[1.7] text-muted-foreground">{facts.join(" · ")}</span>
    </header>
  );
}
