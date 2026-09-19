"use client";

import { Btn } from "@/components/ds/primitives";
import { StateCard } from "./state-card";

// Shown when a page's data request fails. Detection runs server-side, so nothing is lost.
export function ApiUnreachable({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateCard
      size="page"
      tone="failed"
      eyebrow="API unreachable"
      title="We can't reach the Revokr API"
      gradientTitle
      className="max-w-[560px] gap-3"
      actions={
        <Btn variant="primary" onClick={onRetry}>
          Retry
        </Btn>
      }
    >
      <p className="m-0 leading-[1.55]">
        Detection keeps running server-side. This screen just can&apos;t load its data right now. Nothing has
        been changed and no approval has been submitted.
      </p>
    </StateCard>
  );
}
