import { cn } from "@/lib/utils";

// Collapsible in-app manual. Native <details>/<summary>, so it needs no
// JavaScript and is keyboard-operable for free. Drop it above whatever it
// documents and pass the guide as children.
export function Manual({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details className={cn("group rounded-xl border border-line bg-surface", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 text-sm text-ink [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[0.7rem] text-soft transition-colors group-open:border-accent/60 group-open:text-accent"
        >
          ?
        </span>
        <span>{title}</span>
        <span
          aria-hidden
          className="ml-auto text-soft transition-transform duration-200 group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5 text-sm leading-relaxed text-soft">
        {children}
      </div>
    </details>
  );
}
