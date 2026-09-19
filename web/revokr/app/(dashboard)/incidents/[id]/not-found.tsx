import Link from "next/link";
import { btn } from "@/components/ds/primitives";
import { StateCard } from "@/components/states/state-card";

export default function IncidentNotFound() {
  return (
    <StateCard
      tone="unsupported"
      eyebrow="404 · not found"
      title="No incident with that id"
      className="max-w-[360px]"
      actions={
        <Link href="/incidents" className={btn()}>
          Back to incidents
        </Link>
      }
    >
      It may belong to another installation, or the link is stale. Incidents are never deleted.
    </StateCard>
  );
}
