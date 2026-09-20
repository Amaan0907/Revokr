import { ChevronRight, Search } from "lucide-react";
import { HeroDemo } from "./hero-demo";
import { LogoMark } from "@/components/shell/logo";

// The product on a pane of glass, with Revokr's own toolbar rather than borrowed OS window chrome.
export function HeroShowcase() {
  return (
    <div className="animate-lift [animation-delay:300ms]">
      <div className="glass-rim relative overflow-hidden rounded-[20px] bg-[#0b0b0c]/75 shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_40px_100px_-24px_rgb(0_0_0/0.9)]">
        <div
          aria-hidden
          className="flex h-11 items-center gap-3 border-b border-white/[0.06] bg-white/[0.03] pl-4 pr-3 text-[13px]"
        >
          <LogoMark className="size-5" />
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-muted-foreground">acme</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate text-muted-foreground">payments-api</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
            <span className="font-medium">Incidents</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden h-7 items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 text-xs text-muted-foreground sm:flex">
              <Search className="size-3" />
              Search
              <kbd className="font-sans text-[11px] text-muted-foreground/70">⌘K</kbd>
            </span>
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-resolved/15 px-2.5 text-xs font-medium text-resolved">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-resolved" />
                <span className="relative size-1.5 rounded-full bg-resolved" />
              </span>
              Watching
            </span>
          </span>
        </div>

        <HeroDemo />
      </div>
    </div>
  );
}
