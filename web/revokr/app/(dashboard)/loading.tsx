import { Card, Skeleton } from "@/components/ds/primitives";

// Shown the instant a page is opened, while its data loads. Never a spinner-only page.
export default function DashboardLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-[11px] w-[180px] rounded-[6px]" />
      <Skeleton className="h-[26px] w-[min(420px,70%)] rounded-[8px]" style={{ animationDelay: ".1s" }} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        {[0.15, 0.25, 0.35].map((delay) => (
          <Card key={delay} className="h-[92px] animate-[ds-shimmer_1.6s_infinite]" style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-[18px]">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="h-2.5 flex-2 bg-white/7" />
            <Skeleton className="h-2.5 flex-1 bg-white/7" style={{ animationDelay: ".2s" }} />
            <Skeleton className="h-2.5 w-16 bg-white/7" style={{ animationDelay: ".3s" }} />
          </div>
        ))}
      </Card>
    </div>
  );
}
