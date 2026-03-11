import { cn } from "~/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border bg-surface-secondary",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
