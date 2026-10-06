import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Blog</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          Notes on things I learn while building. Search, tags and pagination
          arrive in the next step.
        </p>
      </section>
    </Container>
  );
}
