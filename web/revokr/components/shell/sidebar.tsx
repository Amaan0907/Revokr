"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, LogOut, Search, ShieldAlert } from "lucide-react";
import { IconTile } from "./icon-tile";
import { Logo } from "./logo";
import { UserAvatar } from "./user-avatar";
import type { SessionMode, SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, color: "blue" },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert, color: "red" },
] as const;

export interface SidebarProps {
  user: SessionUser;
  mode: SessionMode;
  organization: string;
  repositoryCount: number;
  needsAttention: number;
  simulation: boolean;
  onNavigate?: () => void;
}

const noSubscribe = () => () => {};

// Shows ⌘K on Apple devices and Ctrl K elsewhere, without a hydration mismatch.
function useIsApple() {
  return useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true,
  );
}

export function Sidebar({
  user,
  mode,
  organization,
  repositoryCount,
  needsAttention,
  simulation,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const isApple = useIsApple();
  // The mobile drawer passes onNavigate; only the always-mounted desktop sidebar owns the shortcut.
  const inDrawer = onNavigate !== undefined;

  useEffect(() => {
    if (inDrawer) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inDrawer]);

  return (
    <div className="flex h-full flex-col px-3 pb-3 pt-4">
      <div className="flex h-8 items-center justify-between px-2">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="Revokr overview"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo />
        </Link>
        {simulation && (
          <span
            title="Simulation mode: no real credentials are touched."
            className="rounded-full bg-simulation/15 px-2 py-0.5 text-[11px] font-semibold text-simulation"
          >
            Simulation
          </span>
        )}
      </div>

      <Form action="/incidents" role="search" onSubmit={onNavigate} className="relative mt-5">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={searchRef}
          name="q"
          type="search"
          placeholder="Search incidents"
          aria-label="Search incidents"
          autoComplete="off"
          className="h-8 w-full rounded-[10px] bg-white/[0.08] pl-8 pr-12 text-[13px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:bg-white/[0.12] focus:ring-2 focus:ring-ring/60 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[5px] bg-white/[0.08] px-1.5 py-px font-sans text-[11px] text-muted-foreground"
        >
          {isApple ? "⌘K" : "Ctrl K"}
        </kbd>
      </Form>

      <nav aria-label="Main" className="mt-5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-9 items-center gap-2.5 rounded-[10px] px-2 text-[13px] font-medium transition-colors duration-200",
                "focus-visible:outline-2 focus-visible:outline-ring",
                active ? "text-foreground" : "text-foreground/80 hover:bg-white/[0.05] hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId={inDrawer ? "sidebar-active-drawer" : "sidebar-active"}
                  aria-hidden
                  className="absolute inset-0 rounded-[10px] bg-white/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_3px_rgb(0_0_0/0.35)]"
                  transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <IconTile icon={item.icon} color={item.color} className="relative" />
              <span className="relative">{item.label}</span>
              {item.href === "/incidents" && needsAttention > 0 && (
                <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-critical px-1.5 text-[11px] font-semibold tabular-nums text-white">
                  {needsAttention}
                  <span className="sr-only"> need your attention</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="surface rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-linear-to-b from-[#48484a] to-[#2c2c2e] text-sm font-semibold uppercase ring-1 ring-inset ring-white/10"
            >
              {organization.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{organization}</p>
              <p className="text-xs text-muted-foreground">{repositoryCount} repositories</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-resolved shadow-[0_0_6px_var(--resolved)]" />
            IAM sandbox · us-east-1
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1">
          <UserAvatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{user.name ?? user.login}</p>
            <p className="truncate text-xs text-muted-foreground">
              {mode === "demo" ? "Demo session" : mode === "google" ? (user.email ?? user.login) : `@${user.login}`}
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
