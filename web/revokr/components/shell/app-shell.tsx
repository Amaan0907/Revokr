"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Ambient } from "./ambient";
import { Logo } from "./logo";
import { Sidebar, type SidebarProps } from "./sidebar";
import { SimulationBanner } from "./simulation-banner";

interface AppShellProps extends Omit<SidebarProps, "onNavigate"> {
  children: ReactNode;
}

export function AppShell({ children, ...sidebarProps }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Ambient />

      {/* A floating glass sidebar, inset from the window edges like macOS. Page content never
          scrolls under it, so it needs no (costly) backdrop blur to look frosted. */}
      <aside className="glass-rim fixed inset-y-3 left-3 z-30 hidden w-60 overflow-hidden rounded-[26px] bg-white/[0.045] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_24px_60px_-20px_rgb(0_0_0/0.8)] lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-white/[0.08] bg-black/55 px-4 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <Link
          href="/dashboard"
          aria-label="Revokr overview"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          className="glass-control grid size-9 cursor-pointer place-items-center rounded-full text-foreground/90 transition-colors hover:bg-white/15 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div key="mobile-nav" className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/65"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="glass-rim absolute inset-y-2 left-2 w-72 max-w-[calc(100vw-5rem)] rounded-[26px] bg-[#101012]/90 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.9)]"
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Sidebar {...sidebarProps} onNavigate={closeMenu} />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                autoFocus
                className="glass-control absolute left-full top-1 ml-3 grid size-9 cursor-pointer place-items-center rounded-full text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[16.5rem]">
        {sidebarProps.simulation && <SimulationBanner />}
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 outline-none sm:px-6 lg:px-10 lg:pt-8"
        >
          {children}
        </main>
      </div>
    </>
  );
}
