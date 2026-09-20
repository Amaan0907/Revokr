import type { ReactNode } from "react";
import { Sidebar, type SidebarProps } from "./sidebar";
import { SimulationBanner } from "./simulation-banner";

interface AppShellProps extends SidebarProps {
  simulation: boolean;
  children: ReactNode;
}

// Rail on the left, page on the right, filling the whole window.
// On desktop the shell is exactly one screen tall and never scrolls itself: the rail stays put and
// only <main> scrolls. On a phone the rail stacks above the page and the whole page scrolls as usual.
export function AppShell({ children, simulation, ...sidebarProps }: AppShellProps) {
  return (
    <div className="ds-root flex min-h-dvh w-full flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#f5f5f7] focus:px-4 focus:py-2 focus:text-[13px] focus:text-black"
      >
        Skip to content
      </a>

      <Sidebar {...sidebarProps} />

      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-[18px] p-4 outline-none lg:overflow-y-auto lg:px-8 lg:pt-7 lg:pb-14">
        {simulation && <SimulationBanner />}
        {children}
      </main>
    </div>
  );
}
