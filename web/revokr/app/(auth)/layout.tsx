import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Ambient } from "@/components/shell/ambient";
import { Logo } from "@/components/shell/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Ambient animated />

      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Revokr home"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        <Link
          href="/"
          className="glass-control inline-flex h-8 items-center gap-0.5 rounded-full pl-2 pr-3.5 text-[13px] text-foreground/80 transition-colors hover:bg-white/15 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Home
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {/* The whole form sits on one pane of glass over slowly drifting light. */}
        <div className="surface w-full max-w-[27rem] rounded-[32px] px-6 py-9 animate-in fade-in zoom-in-95 animation-duration-700 fill-mode-both sm:px-10 sm:py-11">
          {children}
        </div>
      </main>

      <footer className="px-4 pb-8 text-center text-xs text-muted-foreground">
        Copyright © {new Date().getFullYear()} Revokr. Raw secrets are never stored, logged or shown.
      </footer>
    </div>
  );
}
