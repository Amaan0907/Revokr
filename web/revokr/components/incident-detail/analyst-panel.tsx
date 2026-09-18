"use client";

import { Cloud, FileText, Info, Lock, Sparkles } from "lucide-react";
import { STATUS_META } from "@/lib/incident-meta";
import type { Analysis, AnalysisSource, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

const SOURCE: Record<AnalysisSource, { label: string; icon: typeof Cloud; className: string; title: string }> = {
  bedrock: {
    label: "Amazon Bedrock",
    icon: Cloud,
    className: "border-primary/40 bg-primary/15 text-foreground",
    title: "Written by a model on Amazon Bedrock from sanitized incident data.",
  },
  template: {
    label: "Template",
    icon: FileText,
    className: "border-border bg-muted text-muted-foreground",
    title: "Bedrock wasn't used for this incident, so this text comes from a fixed template.",
  },
};

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.65) return "Medium";
  return "Low";
}

interface AnalystPanelProps {
  analysis: Analysis | null;
  initialStatus: IncidentStatus;
}

export function AnalystPanel({ analysis, initialStatus }: AnalystPanelProps) {
  const { status } = useLiveIncident();
  const source = analysis ? SOURCE[analysis.source] : null;
  const SourceIcon = source?.icon;

  return (
    <section
      aria-labelledby="analyst-heading"
      className="relative overflow-hidden rounded-xl border border-primary/25 bg-card p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-primary/10 to-transparent"
      />

      <div className="relative flex items-center justify-between gap-3">
        <h2 id="analyst-heading" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles aria-hidden className="size-4 text-progress" />
          AI incident analyst
        </h2>
        {source && SourceIcon && (
          <span
            title={source.title}
            className={cn(
              "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium",
              source.className,
            )}
          >
            <SourceIcon aria-hidden className="size-3.5" />
            {source.label}
          </span>
        )}
      </div>

      {analysis ? (
        <div className="relative mt-4 flex flex-col gap-4">
          <p className="text-[15px] leading-relaxed animate-in fade-in duration-500 fill-mode-both">
            {analysis.summary}
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both [animation-delay:120ms]">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Why it matters
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{analysis.whyItMatters}</p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both [animation-delay:240ms]">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended response
            </h3>
            <p className="mt-1.5 rounded-md border-l-2 border-progress bg-progress/5 px-3 py-2 text-sm leading-relaxed">
              {analysis.recommendedResponse}
            </p>
          </div>

          <div className="flex items-center gap-3 animate-in fade-in duration-500 fill-mode-both [animation-delay:360ms]">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full origin-left animate-grow-x bg-progress"
                style={{ transform: `scaleX(${analysis.confidence})`, animationDelay: "420ms" }}
              />
            </span>
            <span className="text-xs tabular-nums">
              <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>{" "}
              <span className="text-muted-foreground">{confidenceLabel(analysis.confidence)}</span>
            </span>
          </div>

          {status !== initialStatus && (
            <p className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Written while this incident was {STATUS_META[initialStatus].label.toLowerCase()}. It
              hasn&apos;t been regenerated since.
            </p>
          )}
        </div>
      ) : (
        <div className="relative mt-4 rounded-lg border border-dashed px-4 py-6 text-center">
          <p className="text-sm font-medium">No analysis yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It&apos;s written once the secret has been validated and scored.
          </p>
        </div>
      )}

      <p className="relative mt-5 flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Only sanitized metadata is sent for analysis. The secret itself never reaches the model.
      </p>
    </section>
  );
}
