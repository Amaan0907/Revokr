import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function IncidentNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/40 px-6 py-20 text-center">
      <SearchX aria-hidden className="size-6 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Incident not found</h1>
      <p className="text-sm text-muted-foreground">
        It may have been removed, or the link is wrong.
      </p>
      <Link
        href="/incidents"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 rounded-md")}
      >
        Back to incidents
      </Link>
    </div>
  );
}
