export function WordDivider({ words }: { words: string[] }) {
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className="relative overflow-hidden py-10 select-none" aria-hidden>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-bg to-transparent"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-bg to-transparent"
      />
      <div className="flex w-max animate-marquee-slow whitespace-nowrap">
        {row.map((word, i) => (
          <span key={i} className="flex items-center">
            <span className="text-outline px-8 font-display text-[9vw] font-bold uppercase leading-none tracking-tight transition-colors duration-500 hover:text-neon/60">
              {word}
            </span>
            <span className="gradient-text text-[6vw]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}