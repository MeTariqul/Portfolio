import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/lib/site";
import {
  getSettings,
  getSkills,
  getExperience,
  getCopy,
} from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["about.title"],
    description: copy["about.metaDescription"],
  };
}

export const revalidate = 60;

export default async function AboutPage() {
  const [settings, skills, experience, copy] = await Promise.all([
    getSettings(),
    getSkills(),
    getExperience(),
    getCopy(),
  ]);
  const { about } = settings;

  const groups = new Map<string, string[]>();
  for (const s of skills) {
    const list = groups.get(s.group) ?? [];
    list.push(s.name);
    groups.set(s.group, list);
  }

  return (
    <Container>
      <section className="py-20 md:py-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="max-w-[680px] text-4xl">{copy["about.h1"]}</h1>
            <p className="mt-6 max-w-[680px] text-lg text-soft">
              {copy["about.intro"]}
            </p>
          </div>
          <Image
            src="/profile.jpg"
            alt={copy["ui.portraitAlt"]}
            width={160}
            height={160}
            className="rounded-full border border-line self-start"
          />
        </div>

        <div className="mt-12 max-w-[680px] space-y-6">
          {about.story.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 max-w-[680px]">
          <h2 className="text-2xl">{copy["about.enjoyHeading"]}</h2>
          <p className="mt-3 text-soft">
            {about.interests.join(". ")}.
          </p>
        </div>
      </section>

      <Reveal as="section" className="pb-16" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-3xl">
          {copy["about.timelineHeading"]}
        </h2>
        <div className="mt-6">
          {experience.map((e) => (
            <div
              key={`${e.org}-${e.title}`}
              className="grid gap-2 border-t border-line py-6 md:grid-cols-[160px_1fr] md:gap-8"
            >
              <p className="font-mono text-sm text-soft">{e.period}</p>
              <div>
                <h3 className="text-xl">
                  {e.title}
                  <span className="text-soft"> · {e.org}</span>
                </h3>
                <p className="mt-2 max-w-[680px] text-soft">{e.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="pb-16" aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="text-3xl">
          {copy["about.skillsHeading"]}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group} className="border-t border-line pt-5">
              <h3 className="text-lg">{group}</h3>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-soft">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      <section className="border-t border-line py-16">
        <h2 className="text-3xl">{copy["about.cvHeading"]}</h2>
        <p className="mt-4 max-w-[680px] text-soft">
          {copy["about.cvBody"]}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href={site.cvPath}
            download
            className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-[0.95rem] font-medium text-accent-contrast transition-opacity hover:opacity-90"
          >
            {copy["about.cvDownload"]}
          </a>
          <ButtonLink href="/contact" variant="secondary">
            {copy["about.cvWork"]}
          </ButtonLink>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {copy["about.cvTools"]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
        </div>
      </section>
    </Container>
  );
}
