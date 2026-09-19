"use client";

import { useEffect, useRef } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "./user-avatar";
import type { SessionMode, SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", glyph: "◫" },
  { href: "/incidents", label: "Incidents", glyph: "◆" },
  { href: "/repositories", label: "Repositories", glyph: "◲" },
  { href: "/audit", label: "Audit log", glyph: "≡" },
  { href: "/settings", label: "Settings", glyph: "⚙" },
] as const;

export interface SidebarProps {
  user: SessionUser;
  mode: SessionMode;
  needsAttention: number;
}

// A flat rail on desktop; on a phone it stacks above the page, with the links wrapping in a row.
export function Sidebar({ user, mode, needsAttention }: SidebarProps) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-[18px] border-b border-white/8 bg-sidebar px-3.5 py-[18px] lg:sticky lg:top-0 lg:h-dvh lg:w-[232px] lg:overflow-y-auto lg:border-r lg:border-b-0">
      <Link href="/dashboard" aria-label="Revokr overview" className="flex w-fit items-center gap-[9px]">
        <span aria-hidden className="size-[22px] rounded-[7px] bg-[linear-gradient(160deg,#f5f5f7,#86868b)]" />
        <span className="text-[15px] font-semibold tracking-[-.01em]">Revokr</span>
      </Link>

      <Form
        action="/incidents"
        role="search"
        className="flex items-center gap-2 rounded-[10px] border border-white/8 bg-white/4 px-2.5 py-2 focus-within:border-white/20"
      >
        <span aria-hidden className="font-mono text-[12px] text-muted-foreground">
          ⌕
        </span>
        <input
          ref={searchRef}
          name="q"
          type="search"
          placeholder="Search incidents"
          aria-label="Search incidents"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#f5f5f7] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
      </Form>

      <nav aria-label="Main" className="flex flex-row flex-wrap gap-0.5 lg:flex-col">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] transition-colors lg:w-full",
                active ? "bg-white/8 font-medium text-[#f5f5f7]" : "text-muted-foreground hover:text-[#f5f5f7]",
              )}
            >
              <span aria-hidden className="font-mono text-[12px] text-muted-foreground">
                {item.glyph}
              </span>
              <span>{item.label}</span>
              {item.href === "/incidents" && needsAttention > 0 && (
                <span className="ml-auto font-mono text-[10px] font-medium text-approval">
                  {needsAttention}
                  <span className="sr-only"> need your attention</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-white/8 pt-3.5 lg:mt-auto">
        <UserAvatar user={user} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[12px] font-medium">{user.name ?? user.login}</span>
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {mode === "demo" ? "Demo session" : mode === "google" ? (user.email ?? user.login) : `@${user.login}`}
          </span>
        </div>
        <form action="/api/auth/logout" method="post" className="ml-auto">
          <button
            type="submit"
            className="cursor-pointer rounded-[6px] px-1.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-[#f5f5f7]"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
