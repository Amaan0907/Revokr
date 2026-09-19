import type { ReactNode } from "react";
import { Sidebar, type SidebarProps } from "./sidebar";
import { SimulationBanner } from "./simulation-banner";

interface AppShellProps extends SidebarProps {
  simulation: boolean;
  children: ReactNode;
}

// Rail on the left, page on the right, capped at the design's 1440px so wide screens don't stretch it.
export function AppShell({ children, simulation, ...sidebarProps }: AppShellProps) {
  return (
    <div className="ds-root mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#f5f5f7] focus:px-4 focus:py-2 focus:text-[13px] focus:text-black"
      >
        Skip to content
      </a>

      <Sidebar {...sidebarProps} />

      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-[18px] p-4 outline-none lg:px-8 lg:pt-7 lg:pb-14">
        {simulation && <SimulationBanner />}
        {children}
      </main>
    </div>
  );
}
