import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Services</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          What I offer, how I work, and how to start a project. Written out in
          the next step.
        </p>
      </section>
    </Container>
  );
}
