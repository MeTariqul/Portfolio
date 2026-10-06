import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name}, web developer in ${site.location}.`,
};

export default function ContactPage() {
  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="text-4xl">Contact</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          Have a project, a role, or just a question? Write to me. I read every
          message and reply within a day.
        </p>

        <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,560px)_1fr]">
          <ContactForm />

          <div className="md:pt-1">
            <h2 className="text-xl">Direct</h2>
            <ul className="mt-4 space-y-3 text-soft">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="link-underline text-ink hover:text-accent"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-ink hover:text-accent"
                >
                  github.com/MeTariqul
                </a>
              </li>
              <li>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-ink hover:text-accent"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
            <p className="mt-6 max-w-[320px] text-sm text-soft">
              Based in {site.location}. I am comfortable working across time
              zones.
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}
