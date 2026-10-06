import { cn } from "@/lib/utils";

// Wrapper that applies the rendered-markdown styles.
export function Prose({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("prose-site", className)} {...props} />;
}
