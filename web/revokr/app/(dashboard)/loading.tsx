// Shown the instant you click into a dashboard page, while it renders, so navigation never feels stuck.
export default function DashboardLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8 animate-in fade-in animation-duration-300">
      <span className="sr-only" role="status">
        Loading
      </span>
      <div className="flex flex-col gap-2.5">
        <div className="skeleton h-4 w-36 rounded-full" />
        <div className="skeleton h-9 w-52 rounded-xl" />
        <div className="skeleton h-4 w-full max-w-md rounded-full" />
      </div>
      <div className="skeleton h-28 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-36 rounded-3xl" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );
}
