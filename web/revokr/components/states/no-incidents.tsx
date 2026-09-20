import Link from "next/link";
import { btn } from "@/components/ds/primitives";
import { timeAgo } from "@/lib/format";
import { StateCard } from "./state-card";

interface NoIncidentsProps {
  monitored: number;
  lastPushAt: string | null;
}

// An empty list isn't an empty setup, so the copy depends on whether anything is being watched.
export function NoIncidents({ monitored, lastPushAt }: NoIncidentsProps) {
  const watching = monitored > 0;
  return (
    <StateCard
      tone={watching ? "resolved" : "muted"}
      eyebrow={watching ? "Zero data · incidents" : "Nothing monitored"}
      title={watching ? "No incidents. That’s the good outcome." : "Nothing is being monitored yet"}
      actions={
        <Link href={watching ? "/settings" : "/repositories"} className={btn()}>
          {watching ? "Try simulation" : "Choose repositories"}
        </Link>
      }
    >
      {watching ? (
        <>
          {monitored} {monitored === 1 ? "repository" : "repositories"} monitored
          {lastPushAt && (
            <>
              , last push <time dateTime={lastPushAt} suppressHydrationWarning>{timeAgo(lastPushAt)}</time>
            </>
          )}
          , nothing matched.
        </>
      ) : (
        "Turn on a repository and Revokr will scan its next push."
      )}
    </StateCard>
  );
}
