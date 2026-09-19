import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { buttonVariants } from "@/components/ui/button";
import { HoverButtonContent, hoverButtonVariants } from "@/components/ui/hover-button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
];

// A floating glass pill, 80% of the screen wide and centred. The header row itself is pulled up
// over the top of the page (the negative margin cancels its height), so the glass has the hero
// behind it to blur; the row ignores the pointer so only the pill itself catches clicks.
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="pointer-events-none sticky top-0 z-50 -mb-[4.75rem] flex justify-center pt-3">
      <div className="glass-rim pointer-events-auto relative flex h-16 w-[80vw] items-center justify-between gap-6 rounded-full bg-white/[0.07] pl-6 pr-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_16px_48px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl backdrop-saturate-150">
        <Link
          href="/"
          aria-label="Revokr home"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-[13px] text-foreground/70 transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {signedIn ? (
            <Link href="/dashboard" className={hoverButtonVariants({ size: "sm" })}>
              <HoverButtonContent>Open dashboard</HoverButtonContent>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-foreground/80")}
              >
                Sign in
              </Link>
              <Link href="/signup" className={hoverButtonVariants({ size: "sm" })}>
                <HoverButtonContent>Get started</HoverButtonContent>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
