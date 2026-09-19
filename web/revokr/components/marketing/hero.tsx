import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MousePointerClick, RefreshCw, ShieldCheck } from "lucide-react";
import { HeroGitMark } from "./hero-git-mark";
import { HeroShowcase } from "./hero-showcase";
import { IconBox } from "./icon-box";
import { RotatingWord } from "./rotating-word";
import { SectionHeading } from "./section-heading";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";

// Each headline word rises in on its own beat; delays are inline so the CSS stays generic.
const WORD = "animate-rise inline-block pb-[0.1em]";

// Each point mirrors a step of the incident the replay plays.
export const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ShieldCheck, title: "Proven live", body: "Checked with AWS before you're alerted." },
  { icon: RefreshCw, title: "Replace first", body: "The old key is revoked last." },
  { icon: MousePointerClick, title: "One click", body: "Nothing rotates until you approve." },
];

// A short headline, one sentence and two actions, with the product on its own band just below.
export function Hero() {
  return (
    <>
      <section id="home" className="relative border-b border-white/[0.08]">
        {/* The git mark sits on the right, centred on the first screen. It only shows where there's
            room beside the headline, and never takes clicks from the buttons. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[5vw] hidden items-center lg:flex">
          <HeroGitMark />
        </div>

        {/* The header floats over the top of this section, so it fills the whole first screen. */}
        <div className="relative mx-auto flex min-h-dvh w-[90vw] flex-col items-start justify-center py-14 text-left">
          <h1 className="text-[length:clamp(2.7rem,4.9vw,3.96rem)] font-semibold leading-[1.05] tracking-[-0.045em]">
            <span className={`${WORD} text-silver`} style={{ animationDelay: "80ms" }}>
              Leaked.
            </span>{" "}
            <span className={`${WORD} text-silver`} style={{ animationDelay: "200ms" }}>
              Replaced.
            </span>{" "}
            <span className={WORD} style={{ animationDelay: "320ms" }}>
              <RotatingWord words={["Secured.", "Revoked."]} className="text-fade" />
            </span>
          </h1>

          <p
            className="animate-lift mt-5 max-w-md text-[18px] leading-relaxed text-muted-foreground"
            style={{ animationDelay: "420ms" }}
          >
            Revokr replaces a leaked key, then revokes the old one. You just approve.
          </p>

          <div
            className="animate-lift mt-6 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "520ms" }}
          >
            <Link href="/signup" className={hoverButtonVariants({ size: "hero" })}>
              <HoverButtonContent>Get started</HoverButtonContent>
            </Link>
          </div>
        </div>
      </section>

      {/* Copy on the left explains the replay on the right; the left edge matches the hero's text. */}
      <section aria-label="Product preview" className="border-b border-white/[0.08] py-12">
        <div className="mx-auto grid w-[90vw] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="One incident, start to finish"
              title="Fifteen seconds from leaked to dead."
              description="Watch a real AWS key go from a push to fully revoked."
            />
            <ul className="mt-7 flex flex-col gap-4">
              {POINTS.map((point) => (
                <li key={point.title} className="flex items-center gap-3.5">
                  <IconBox icon={point.icon} />
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold tracking-[-0.015em]">{point.title}</p>
                    <p className="text-[13px] text-muted-foreground">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <HeroShowcase />
          </div>
        </div>
      </section>
    </>
  );
}
