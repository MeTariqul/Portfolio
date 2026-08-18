const ITEMS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Redis",
  "Tailwind CSS",
  "Three.js",
  "Framer Motion",
  "AI / LLM",
  "Vercel",
  "Cloudflare",
];

export function Marquee({
  items: propItems,
  slow = false,
}: {
  items?: string[];
  slow?: boolean;
}) {
  const items = propItems && propItems.length > 0 ? propItems : ITEMS;
  const row = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent"
      />
      <div
        className={`flex w-max items-center gap-10 whitespace-nowrap ${
          slow ? "animate-marquee-slow" : "animate-marquee"
        } hover:[animation-play-state:paused]`}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-xl font-semibold uppercase tracking-wide text-soft transition-colors hover:text-neon sm:text-2xl">
              {item}
            </span>
            <span className="gradient-text text-lg">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
