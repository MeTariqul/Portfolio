import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Uses" };

export default function UsesPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Uses</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          The tools and setup I use day to day. Filled in during the content
          step.
        </p>
      </section>
    </Container>
  );
}
