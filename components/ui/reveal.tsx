// Wraps sections that fade in as they scroll into the viewport. The
// animation itself is plain IntersectionObserver code in app/layout.tsx, so
// this component needs no client hydration at all.
export function Reveal({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`reveal ${className ?? ""}`} {...rest}>
      {children}
    </Tag>
  );
}
