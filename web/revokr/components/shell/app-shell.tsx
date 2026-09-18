"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar/80 backdrop-blur-xl lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          className="grid size-10 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div key="mobile-nav" className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              className="absolute inset-y-0 left-0 w-72 max-w-[calc(100vw-4rem)] border-r bg-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Sidebar {...sidebarProps} onNavigate={closeMenu} />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                autoFocus
                className="absolute left-full top-3 ml-3 grid size-10 cursor-pointer place-items-center rounded-md bg-background/80 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {sidebarProps.simulation && <SimulationBanner />}
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-8 outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </MotionConfig>
  );
}
