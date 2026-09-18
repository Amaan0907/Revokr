import Link from "next/link";
import { ArrowRight, ChevronRight, Lock } from "lucide-react";
import { HeroShowcase } from "./hero-showcase";
import { DemoButton } from "@/components/auth/demo-button";
import { ScrollFade } from "@/components/motion/scroll-fade";
import { buttonVariants } from "@/components/ui/button";

// Each headline word rises in on its own beat; delays are inline so the CSS stays generic.
const WORD = "animate-rise inline-block pb-[0.1em]";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative isolate overflow-hidden pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[48rem] bg-[radial-gradient(55%_50%_at_50%_0%,rgb(41_151_255/0.16),transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-70" />

      <ScrollFade className="mx-auto max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <a
          href="#how-it-works"
          className="glass-control animate-rise inline-flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-[13px] text-muted-foreground transition-colors hover:bg-white/[0.13] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-resolved/15 px-2 py-0.5 text-[11px] font-semibold text-resolved">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-resolved" />
              <span className="relative size-1.5 rounded-full bg-resolved" />
            </span>
            Live
          </span>
          Watching every push, in real time
          <ChevronRight aria-hidden className="size-3.5" />
        </a>

        <h1 className="mt-8 text-[length:clamp(3.25rem,9vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
          <span className={`${WORD} text-silver`} style={{ animationDelay: "80ms" }}>
            Leaked.
          </span>{" "}
          <span className={`${WORD} text-silver`} style={{ animationDelay: "220ms" }}>
            Replaced.
          </span>
          <br />
          <span className={`${WORD} text-spectrum`} style={{ animationDelay: "360ms" }}>
            Revoked.
          </span>
        </h1>

        <p
          className="animate-rise mx-auto mt-8 max-w-2xl text-[length:clamp(1.125rem,2.1vw,1.375rem)] font-medium leading-snug tracking-[-0.015em] text-muted-foreground text-balance"
          style={{ animationDelay: "480ms" }}
        >
          Revokr catches secrets the moment they&apos;re pushed to GitHub, proves they&apos;re live,
          and swaps in a working replacement <span className="text-foreground">before</span> it kills
          the leaked key. You approve. It does the rest.
        </p>

        <div
          className="animate-rise mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7"
          style={{ animationDelay: "600ms" }}
        >
          {signedIn ? (
            <Link href="/dashboard" className={buttonVariants({ size: "xl" })}>
              Open your dashboard
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Link>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants({ size: "xl" })}>
                Get started
                <ArrowRight aria-hidden data-icon="inline-end" />
              </Link>
              <DemoButton className="group inline-flex cursor-pointer items-center gap-1 rounded-sm text-[17px] text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Try the live demo
                <ChevronRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </DemoButton>
            </>
          )}
        </div>

        <p
          className="animate-rise mt-6 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground"
          style={{ animationDelay: "680ms" }}
        >
          <Lock aria-hidden className="size-3.5" />
          Sign in with GitHub. You choose which repositories Revokr can see.
        </p>
      </ScrollFade>

      <HeroShowcase />
    </section>
  );
}
