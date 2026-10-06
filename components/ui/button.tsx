import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-line bg-surface text-ink hover:border-accent/50 disabled:opacity-50",
  quiet:
    "text-ink hover:text-accent disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[0.95rem]",
  sm: "h-9 px-4 text-[0.875rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={classes(variant, size, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & { href: string } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      // Keeps link prefetches out of the first-viewport network window.
      prefetch={false}
      className={classes(variant, size, className)}
      {...props}
    >
      {children}
    </Link>
  );
}
