import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-6 transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
}
