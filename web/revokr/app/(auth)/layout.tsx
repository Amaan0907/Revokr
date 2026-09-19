import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HeaderShell } from "@/components/marketing/site-header";
import { PageGradient } from "@/components/marketing/page-gradient";
import { Logo } from "@/components/shell/logo";

// The sign-in pages open on the landing page's own frame: the same black-and-white gradient, the
// same floating glass header, and the same 90vw column. The arc is turned down to a soft glow so
// it stays behind the form rather than competing with it. There is no footer, because even faded
// the arc is brightest along the bottom edge and would sit under any text placed there.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <PageGradient strength={0.4} />

      <HeaderShell>
        <Link
          href="/"
          aria-label="Revokr home"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        <Link
          href="/"
          className="inline-flex h-8 items-center gap-0.5 rounded-full pl-2 pr-3.5 text-[13px] text-foreground/70 transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Back to home
        </Link>
      </HeaderShell>

      <main className="mx-auto flex w-[90vw] flex-1 items-center pb-14 pt-28">{children}</main>
    </div>
  );
}
