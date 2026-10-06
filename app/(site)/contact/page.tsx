import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Contact</h1>
        <p className="mt-6 max-w-[680px] text-soft">
          The form, direct email and social links land here in the next step.
        </p>
      </section>
    </Container>
  );
}
