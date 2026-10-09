import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/markdown";
import { getServices, getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["services.title"],
    description: copy["services.metaDescription"],
  };
}

export const revalidate = 60;

export default async function ServicesPage() {
  const [services, copy] = await Promise.all([getServices(), getCopy()]);

  const steps = [
    { n: "01", title: copy["services.step1Title"], body: copy["services.step1Body"] },
    { n: "02", title: copy["services.step2Title"], body: copy["services.step2Body"] },
    { n: "03", title: copy["services.step3Title"], body: copy["services.step3Body"] },
  ];

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">{copy["services.title"]}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          {copy["services.intro"]}
        </p>

        <div className="mt-12">
          {services.map((s) => (
            <div
              key={s.title}
              className="grid gap-3 border-t border-line py-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-10"
            >
              <div>
                <h2 className="text-2xl">{s.title}</h2>
                {s.priceNote && (
                  <p className="mt-2 text-sm text-soft">{s.priceNote}</p>
                )}
              </div>
              <div className="max-w-[680px] text-soft">
                <Markdown>{s.descriptionMD}</Markdown>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Reveal
        as="section"
        className="border-t border-line py-16"
        aria-labelledby="how-heading"
      >
        <h2 id="how-heading" className="text-3xl">
          {copy["services.howHeading"]}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="border-t border-line pt-4">
              <p className="font-mono text-sm text-soft" aria-hidden>
                {step.n}
              </p>
              <h3 className="mt-1 text-lg">{step.title}</h3>
              <p className="mt-2 text-soft">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <ButtonLink href="/contact">{copy["cta.startProject"]}</ButtonLink>
        </div>
      </Reveal>
    </Container>
  );
}
