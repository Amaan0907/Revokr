"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, FolderGit2, LayoutGrid, Search, Settings, ShieldAlert } from "lucide-react";
import { HeroDemo } from "./hero-demo";
import { IconTile, type TileColor } from "@/components/shell/icon-tile";
import { LogoMark } from "@/components/shell/logo";
import { cn } from "@/lib/utils";

const NAV: { label: string; icon: LucideIcon; color: TileColor; count?: number }[] = [
  { label: "Overview", icon: LayoutGrid, color: "blue" },
  { label: "Incidents", icon: ShieldAlert, color: "red", count: 3 },
  { label: "Repositories", icon: FolderGit2, color: "indigo" },
  { label: "Settings", icon: Settings, color: "gray" },
];

const REPOS = [
  { name: "acme/payments-api", live: true },
  { name: "acme/web", live: false },
  { name: "acme/infra", live: false },
];

// The product on a pane of glass, with Revokr's own toolbar rather than borrowed OS window chrome.
// It tilts back in 3D and settles flat as you scroll to it.
export function HeroShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <div ref={ref} className="relative mx-auto mt-20 max-w-5xl px-4 sm:mt-24 sm:px-6">
      <div
        aria-hidden
        className="glow-soft pointer-events-none absolute -inset-x-10 top-10 -bottom-10 -z-10 opacity-45"
      />
      <div className="animate-lift [animation-delay:700ms]">
        <motion.div
          style={{ rotateX, scale, transformPerspective: 1800, transformOrigin: "50% 0%" }}
          className="glass-rim relative overflow-hidden rounded-[22px] bg-[#0b0b0c]/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_50px_120px_-20px_rgb(0_0_0/0.9)]"
        >
          <div
            aria-hidden
            className="flex h-12 items-center gap-3 border-b border-white/[0.06] bg-white/[0.03] pl-4 pr-3 text-[13px]"
          >
            <LogoMark className="size-5 rounded-[6px]" />
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

          <div className="grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
            <div
              aria-hidden
              className="hidden flex-col gap-5 border-r border-white/[0.06] bg-white/[0.02] p-3 text-left md:flex"
            >
              <ul className="flex flex-col gap-0.5">
                {NAV.map((item) => (
                  <li
                    key={item.label}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] font-medium",
                      item.label === "Incidents" ? "bg-white/10" : "text-foreground/80",
                    )}
                  >
                    <IconTile icon={item.icon} color={item.color} className="size-5 rounded-[6px] [&_svg]:size-3" />
                    {item.label}
                    {item.count && (
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">{item.count}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div>
                <p className="px-2 text-[11px] font-semibold text-muted-foreground">Repositories</p>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {REPOS.map((repo) => (
                    <li key={repo.name} className="flex h-7 items-center gap-2 px-2 text-xs text-foreground/70">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          repo.live ? "bg-critical shadow-[0_0_8px_var(--critical)]" : "bg-resolved",
                        )}
                      />
                      <span className="truncate font-mono">{repo.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <HeroDemo />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
