import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">About me</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          My story, education, freelance work and skills go here. This page
          gets filled in the next step.
        </p>
      </section>
    </Container>
  );
}
