import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";
import { getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["contact.title"],
    description: copy["contact.metaDescription"],
  };
}

// ISR like the other pages: the copy screen's wording reaches this page
// within a minute instead of waiting for the next deploy.
export const revalidate = 60;

export default async function ContactPage() {
  const copy = await getCopy();

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="text-4xl">{copy["contact.title"]}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          {copy["contact.intro"]}
        </p>

        <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,560px)_1fr]">
          <ContactForm
            labels={{
              name: copy["contact.nameLabel"],
              email: copy["contact.emailLabel"],
              message: copy["contact.messageLabel"],
              send: copy["contact.send"],
              sending: copy["contact.sending"],
              sentHeading: copy["contact.sentHeading"],
            }}
          />

          <div className="md:pt-1">
            <h2 className="text-xl">{copy["contact.directHeading"]}</h2>
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
                  {copy["contact.githubLabel"]}
                </a>
              </li>
              <li>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-ink hover:text-accent"
                >
                  {copy["ui.linkedin"]}
                </a>
              </li>
            </ul>
            <p className="mt-6 max-w-[320px] text-sm text-soft">
              {copy["contact.timezoneNote"]}
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}
