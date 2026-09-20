import Image from "next/image";
import { cn } from "@/lib/utils";

// The Revokr mark: a key whose bow is a rotation arrow, on a round black disc. The disc is part of
// the image, so it's drawn as-is and only clipped to a circle.
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden
      width={56}
      height={56}
      className={cn("size-7 shrink-0 rounded-full", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.022em]">Revokr</span>
    </span>
  );
}
