import type { ReactNode } from "react";
import Link from "next/link";
import { NavLinks } from "./nav-links";
import { Logo } from "@/components/shell/logo";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";

// A floating glass pill, 90% of the screen wide and centred, the same column as the page below it.
// The header row itself is pulled up over the top of the page (the negative margin cancels its
// height), so the glass has the hero behind it to blur; the row ignores the pointer so only the
// pill itself catches clicks. The sign-in pages share it, so they open on the same header.
export function HeaderShell({ children }: { children: ReactNode }) {
  return (
    <header className="pointer-events-none sticky top-0 z-50 -mb-[4.75rem] flex justify-center pt-3">
      <div className="glass-rim pointer-events-auto relative flex h-16 w-[90vw] items-center justify-between gap-6 rounded-full bg-white/[0.07] pl-6 pr-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_16px_48px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl backdrop-saturate-150">
        {children}
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <HeaderShell>
      <Link
        href="/"
        aria-label="Revokr home"
        className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Logo />
      </Link>

      <NavLinks />

      <div className="flex items-center gap-1">
        <Link href="/signup" className={hoverButtonVariants({ size: "sm" })}>
          <HoverButtonContent>Get started</HoverButtonContent>
        </Link>
      </div>
    </HeaderShell>
  );
}
