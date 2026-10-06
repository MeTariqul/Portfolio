"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to an error tracker.
    console.error(error);
  }, [error]);

  return (
    <Container>
      <section className="py-24 md:py-32">
        <p className="text-sm text-soft">Something went wrong</p>
        <h1 className="mt-3 max-w-[680px] text-4xl">
          The page hit a snag while loading.
        </h1>
        <p className="mt-5 max-w-[680px] text-soft">
          Nothing you did wrong. Try again, and if it keeps failing, send me a
          note and I&apos;ll look into it.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center rounded-full bg-accent px-6 text-[0.95rem] font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </section>
    </Container>
  );
}
