"use client";

import { Cloud, FileText, Info, Lock, Sparkles } from "lucide-react";
import { WipeIn } from "@/components/motion/wipe-in";
import { STATUS_META } from "@/lib/incident-meta";
import type { Analysis, AnalysisSource, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveIncident } from "./incident-live";

const SOURCE: Record<AnalysisSource, { label: string; icon: typeof Cloud; className: string; title: string }> = {
  bedrock: {
    label: "Amazon Bedrock",
    icon: Cloud,
    className: "bg-white/10 text-foreground",
    title: "Written by a model on Amazon Bedrock from sanitized incident data.",
  },
  template: {
    label: "Template",
    icon: FileText,
    className: "bg-white/[0.06] text-muted-foreground",
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

// Wrapped in an Apple Intelligence-style animated spectrum edge, so AI-written text is unmistakable.
export function AnalystPanel({ analysis, initialStatus }: AnalystPanelProps) {
  const { status } = useLiveIncident();
  const source = analysis ? SOURCE[analysis.source] : null;
  const SourceIcon = source?.icon;
  const bedrock = analysis?.source === "bedrock";

  return (
    <section aria-labelledby="analyst-heading" className="relative">
      {bedrock && (
        <div
          aria-hidden
          className="glow-fill pointer-events-none absolute -inset-1 rounded-[28px] opacity-25 blur-xl"
        />
      )}
      <div className="surface relative overflow-hidden rounded-3xl p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-simulation/[0.08] to-transparent"
        />

        <div className="relative flex items-center justify-between gap-3">
          <h2 id="analyst-heading" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em]">
            <Sparkles aria-hidden className="size-[18px] text-simulation" />
            <span className="text-spectrum">AI incident analyst</span>
          </h2>
          {source && SourceIcon && (
            <span
              title={source.title}
              className={cn(
                "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
                source.className,
              )}
            >
              <SourceIcon aria-hidden className="size-3.5" />
              {source.label}
            </span>
          )}
        </div>

        {analysis ? (
          <div className="relative mt-5 flex flex-col gap-5">
            <p className="text-[15px] leading-relaxed animate-in fade-in animation-duration-700 fill-mode-both">
              {analysis.summary}
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-1 animation-duration-500 fill-mode-both [animation-delay:120ms]">
              <h3 className="text-[13px] font-semibold text-muted-foreground">Why it matters</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{analysis.whyItMatters}</p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-1 animation-duration-500 fill-mode-both [animation-delay:240ms]">
              <h3 className="text-[13px] font-semibold text-muted-foreground">Recommended response</h3>
              <p className="mt-1.5 rounded-xl bg-link/[0.08] px-3.5 py-2.5 text-sm leading-relaxed shadow-[inset_2px_0_0_var(--link)]">
                {analysis.recommendedResponse}
              </p>
            </div>

            <div className="flex items-center gap-3 animate-in fade-in animation-duration-500 fill-mode-both [animation-delay:360ms]">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <div aria-hidden className="h-1.5 flex-1 rounded-full bg-white/[0.08]">
                <WipeIn className="h-full" delay={0.4}>
                  <div
                    className="h-full rounded-full bg-linear-to-r from-simulation to-link"
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </WipeIn>
              </div>
              <span className="text-xs tabular-nums">
                <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>{" "}
                <span className="text-muted-foreground">{confidenceLabel(analysis.confidence)}</span>
              </span>
            </div>

            {status !== initialStatus && (
              <p className="flex items-start gap-2 rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-xs text-muted-foreground">
                <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                Written while this incident was {STATUS_META[initialStatus].label.toLowerCase()}. It
                hasn&apos;t been regenerated since.
              </p>
            )}
          </div>
        ) : (
          <div className="relative mt-5 rounded-2xl bg-white/[0.04] px-4 py-7 text-center">
            <p className="text-sm font-medium">No analysis yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              It&apos;s written once the secret has been validated and scored.
            </p>
          </div>
        )}

        <p className="relative mt-6 flex items-start gap-2 border-t border-white/[0.06] pt-4 text-xs text-muted-foreground">
          <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Only sanitized metadata is sent for analysis. The secret itself never reaches the model.
        </p>
      </div>
      {bedrock && (
        <div
          aria-hidden
          className="glow-fill glow-ring pointer-events-none absolute inset-0 rounded-3xl opacity-70"
        />
      )}
    </section>
  );
}
