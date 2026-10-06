import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Projects</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          A filterable list of my work, each with its own case study. Built
          out in the next step.
        </p>
      </section>
    </Container>
  );
}
