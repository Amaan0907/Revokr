"use client";

import { Card, Eyebrow } from "@/components/ds/primitives";
import { STATUS_META } from "@/lib/incident-meta";
import type { Analysis, AnalysisSource, IncidentStatus } from "@/lib/types";
import { useLiveIncident } from "./incident-live";

// Shown exactly as the API reports it, so the panel never misstates who wrote the text.
const SOURCE_LABEL: Record<AnalysisSource, string> = {
  bedrock: "model (bedrock)",
  openai: "model (openai)",
  template: "template fallback",
};

interface AnalystPanelProps {
  analysis: Analysis | null;
  initialStatus: IncidentStatus;
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <Eyebrow className="tracking-[.14em]">{label}</Eyebrow>
      <span className="text-[12px] leading-[1.6] text-muted-foreground">{children}</span>
    </div>
  );
}

// The model explains; it never decides. If it isn't available, a deterministic template fills the
// same fields, and the rest of the page is unaffected.
export function AnalystPanel({ analysis, initialStatus }: AnalystPanelProps) {
  const { status } = useLiveIncident();

  if (!analysis) {
    return (
      <Card as="section" aria-labelledby="analyst-heading" className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 id="analyst-heading" className="m-0 text-[14px] font-medium">
            Analyst panel
          </h2>
          <Eyebrow className="tracking-[.12em]">not written yet</Eyebrow>
        </div>
        <span className="text-[12px] leading-[1.6] text-muted-foreground">
          It&apos;s written once the secret has been validated and scored. Until then, risk, actions and the
          audit trail all still render.
        </span>
      </Card>
    );
  }

  const source = SOURCE_LABEL[analysis.source];

  return (
    <Card as="section" aria-labelledby="analyst-heading" className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id="analyst-heading" className="m-0 text-[14px] font-medium">
          Analyst panel
        </h2>
        <Eyebrow className="tracking-[.12em]">
          source: {source} · confidence {analysis.confidence.toFixed(2)}
        </Eyebrow>
      </div>

      <span className="text-[13px] leading-[1.65]">{analysis.summary}</span>
      <Field label="why it matters">{analysis.whyItMatters}</Field>
      <Field label="recommended response">{analysis.recommendedResponse}</Field>

      {status !== initialStatus && (
        <span className="text-[11px] leading-[1.6] text-muted-foreground">
          Written while this incident was {STATUS_META[initialStatus].label.toLowerCase()}. It hasn&apos;t been
          regenerated since.
        </span>
      )}

      <span className="text-[11px] leading-[1.6] text-approval">
        The AI explains, it never decides.
        {analysis.source === "template" &&
          " The model wasn't used here, so the same fields are filled in deterministically."}{" "}
        Only sanitized metadata is sent for analysis; the secret itself never reaches the model.
      </span>
    </Card>
  );
}
