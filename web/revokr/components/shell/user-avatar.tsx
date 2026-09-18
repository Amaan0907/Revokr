import Image from "next/image";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: SessionUser; className?: string }) {
  const label = user.name ?? user.login;

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={32}
        height={32}
        className={cn("size-8 shrink-0 rounded-full ring-1 ring-white/10", className)}
      />
    );
  }

  // Contacts-style monogram when there's no photo.
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#636366] text-[13px] font-semibold uppercase text-white",
        className,
      )}
    >
      {label.charAt(0)}
    </span>
  );
}
