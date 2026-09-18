"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll } from "framer-motion";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ApproveVisual, DetectVisual, RotateVisual, ScoreVisual } from "./story-visuals";
import { cn } from "@/lib/utils";

type VisualKind = "detect" | "score" | "approve" | "rotate";

const STEPS: { kind: VisualKind; eyebrow: string; title: string; body: string }[] = [
  {
    kind: "detect",
    eyebrow: "Detect",
    title: "Caught on push.",
    body: "The Revokr GitHub App sees every push. Gitleaks scans the diff and flags a secret within seconds, long before anyone thinks to clone the repo.",
  },
  {
    kind: "score",
    eyebrow: "Validate and score",
    title: "Proven live. Scored in plain English.",
    body: "Revokr asks the provider whether the key still works, then scores the risk from factors you can actually read: is it live, is the repo public, what can it reach.",
  },
  {
    kind: "approve",
    eyebrow: "Approve",
    title: "Nothing moves without you.",
    body: "Rotating a live credential is a big deal, so a person decides. One click from the dashboard, and Revokr takes it from there.",
  },
  {
    kind: "rotate",
    eyebrow: "Rotate and verify",
    title: "Replaced first. Revoked last.",
    body: "A new key is created, tested and written into GitHub Actions. Only then is the leaked key disabled, and Revokr checks that it's really dead.",
  },
];

function Visual({ kind, instance }: { kind: VisualKind; instance: string }) {
  switch (kind) {
    case "detect":
      return <DetectVisual />;
    case "score":
      return <ScoreVisual gradientId={`story-ring-${instance}`} />;
    case "approve":
      return <ApproveVisual />;
    case "rotate":
      return <RotateVisual />;
  }
}

function StoryStep({
  step,
  index,
  active,
  onActive,
}: {
  step: (typeof STEPS)[number];
  index: number;
  active: boolean;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Active while the step crosses the middle band of the viewport.
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="flex flex-col justify-center py-10 lg:min-h-[75vh] lg:py-0">
      <p
        className={cn(
          "flex items-center gap-3 text-[15px] font-semibold transition-colors duration-500",
          active ? "text-link" : "text-muted-foreground",
        )}
      >
        <span className="font-mono text-[13px] tabular-nums">0{index + 1}</span>
        {step.eyebrow}
      </p>
      <h3
        className={cn(
          "mt-3 text-[length:clamp(1.875rem,3.6vw,2.875rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-balance transition-opacity duration-500",
          !active && "lg:opacity-35",
        )}
      >
        {step.title}
      </h3>
      <p
        className={cn(
          "mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground transition-opacity duration-500",
          !active && "lg:opacity-50",
        )}
      >
        {step.body}
      </p>
      <Reveal className="mt-8 h-96 lg:hidden">
        <Visual kind={step.kind} instance={`inline-${index}`} />
      </Reveal>
    </div>
  );
}

// "How it works" as an Apple-style scroll story: the copy scrolls, the product view stays pinned
// beside it and changes to match whichever step is in the middle of the screen.
export function Story() {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start center", "end center"] });

  return (
    <section id="how-it-works" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            Four steps. <span className="text-muted-foreground">Always in this order.</span>
          </>
        }
        description="The same fixed sequence for every incident, so a rotation can never break production by disabling a key too early."
      />

      <div className="mt-16 lg:mt-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
        <div ref={stepsRef} className="relative lg:pl-10">
          <div aria-hidden className="absolute inset-y-0 left-0 hidden w-px bg-white/10 lg:block">
            <motion.div
              className="h-full w-px origin-top bg-linear-to-b from-link to-simulation"
              style={{ scaleY: scrollYProgress }}
            />
          </div>
          {STEPS.map((step, i) => (
            <StoryStep key={step.kind} step={step} index={i} active={active === i} onActive={setActive} />
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[calc(50vh-14rem)] h-[28rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={STEPS[active].kind}
                className="h-full"
                initial={{ opacity: 0, y: 24, scale: 0.97, filter: "blur(8px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transitionEnd: { filter: "none" },
                }}
                exit={{ opacity: 0, y: -24, scale: 0.97, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Visual kind={STEPS[active].kind} instance="pinned" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
