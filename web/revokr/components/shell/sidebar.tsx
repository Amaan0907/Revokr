"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, LayoutDashboard, Server, ShieldAlert } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
] as const;

export interface SidebarProps {
  organization: string;
  repositoryCount: number;
  needsAttention: number;
  simulation: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  organization,
  repositoryCount,
  needsAttention,
  simulation,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className="flex items-center justify-between px-2">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Revokr overview"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        {simulation && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-simulation/30 bg-simulation/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-simulation">
            <FlaskConical aria-hidden className="size-3" />
            Sim
          </span>
        )}
      </div>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {active && (
                <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
              )}
              <Icon
                aria-hidden
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {label}
              {href === "/incidents" && needsAttention > 0 && (
                <span className="ml-auto rounded-full bg-approval/15 px-1.5 text-[11px] font-semibold tabular-nums text-approval">
                  {needsAttention}
                  <span className="sr-only"> need your attention</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 rounded-lg border bg-card/60 p-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-sm font-semibold uppercase"
          >
            {organization.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{organization}</p>
            <p className="text-xs text-muted-foreground">{repositoryCount} repositories</p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Server aria-hidden className="size-3.5" />
          IAM sandbox · us-east-1
        </p>
      </div>
    </div>
  );
}
