import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function IncidentNotFound() {
  return (
    <div className="surface flex flex-col items-center gap-3 rounded-3xl px-6 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-white/[0.06]">
        <SearchX aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">Incident not found</h1>
      <p className="text-[15px] text-muted-foreground">
        It may have been removed, or the link is wrong.
      </p>
      <Link href="/incidents" className={`${buttonVariants({ variant: "secondary" })} mt-3`}>
        Back to incidents
      </Link>
    </div>
  );
}
