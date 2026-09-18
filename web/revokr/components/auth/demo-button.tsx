import type { ReactNode } from "react";

export function DemoButton({
  next = "/dashboard",
  className,
  children,
}: {
  next?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form action="/api/auth/demo" method="post" className="contents">
      <input type="hidden" name="next" value={next} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
