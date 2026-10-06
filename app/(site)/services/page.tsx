import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/markdown";
import { getServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "What I offer: web development, AI integration, Python backends and performance work.",
};

export const revalidate = 60;

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Services</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          I take on a small number of projects at a time so each one gets real
          attention. Here is what I am usually hired for.
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
          How I work
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          <div className="border-t border-line pt-4">
            <p className="font-mono text-sm text-soft" aria-hidden>
              01
            </p>
            <h3 className="mt-1 text-lg">A short conversation</h3>
            <p className="mt-2 text-soft">
              You tell me what you need and who it is for. I ask a few questions
              and say honestly whether I am the right person.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <p className="font-mono text-sm text-soft" aria-hidden>
              02
            </p>
            <h3 className="mt-1 text-lg">A fixed quote</h3>
            <p className="mt-2 text-soft">
              You get a price and a timeline before any code is written. No
              hourly surprises, no scope tricks.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <p className="font-mono text-sm text-soft" aria-hidden>
              03
            </p>
            <h3 className="mt-1 text-lg">Build and handoff</h3>
            <p className="mt-2 text-soft">
              I build in the open with preview links, then hand over the code,
              the deployment and a short guide so you are not stuck with me.
            </p>
          </div>
        </div>
        <div className="mt-10">
          <ButtonLink href="/contact">Start a project</ButtonLink>
        </div>
      </Reveal>
    </Container>
  );
}
