import Image from "next/image";
import type { SessionUser } from "@/lib/session";

// A 24px circle: their photo when there is one, otherwise a plain dim disc.
export function UserAvatar({ user }: { user: SessionUser }) {
  if (user.avatarUrl) {
    return <Image src={user.avatarUrl} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full" />;
  }
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-medium uppercase"
    >
      {(user.name ?? user.login).charAt(0)}
    </span>
  );
}
