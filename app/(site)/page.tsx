import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProjectRow } from "@/components/project-tile";
import { PostRow } from "@/components/post-row";
import { site } from "@/lib/site";
import {
  getSettings,
  getFeaturedProjects,
  getLatestPosts,
  getCopy,
} from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, projects, posts, copy] = await Promise.all([
    getSettings(),
    getFeaturedProjects(3),
    getLatestPosts(3),
    getCopy(),
  ]);
  const { availability, home } = settings;

  return (
    <Container>
      <section className="py-20 md:py-28">
        <Image
          src="/profile.jpg"
          alt={copy["ui.portraitAlt"]}
          width={132}
          height={132}
          priority
          className="mb-8 rounded-full border border-line"
        />

        <p className="mb-5 inline-flex items-center gap-2 text-sm text-soft">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              availability.available ? "bg-accent" : "bg-soft"
            }`}
            aria-hidden
          />
          {availability.note}
        </p>

        <h1 className="max-w-[680px] text-4xl md:text-5xl">{home.role}</h1>

        <p className="mt-6 max-w-[680px] text-lg text-soft">{home.intro}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">{copy["cta.startProject"]}</ButtonLink>
          <Link
            href="/projects"
            prefetch={false}
            className="link-underline text-soft hover:text-ink"
          >
            {copy["home.workLink"]}
          </Link>
        </div>
      </section>

      {projects.length > 0 && (
        <Reveal as="section" className="pb-16" aria-labelledby="work-heading">
          <h2 id="work-heading" className="text-3xl">
            {copy["home.workHeading"]}
          </h2>
          <div className="mt-6">
            {projects.map((p, i) => (
              <ProjectRow key={p.slug} project={p} index={i} />
            ))}
          </div>
          <p className="mt-6">
            <Link
              href="/projects"
              prefetch={false}
              className="link-underline text-accent"
            >
              {copy["home.allProjects"]}
            </Link>
          </p>
        </Reveal>
      )}

      {posts.length > 0 && (
        <Reveal as="section" className="pb-16" aria-labelledby="writing-heading">
          <h2 id="writing-heading" className="text-3xl">
            {copy["home.writingHeading"]}
          </h2>
          <div className="mt-6">
            {posts.map((p) => (
              <PostRow key={p.slug} post={p} />
            ))}
          </div>
          <p className="mt-6">
            <Link
              href="/blog"
              prefetch={false}
              className="link-underline text-accent"
            >
              {copy["home.allPosts"]}
            </Link>
          </p>
        </Reveal>
      )}

      <Reveal as="section" className="border-t border-line py-16" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="max-w-[680px] text-3xl">
          {copy["home.ctaHeading"]}
        </h2>
        <p className="mt-4 max-w-[680px] text-soft">
          {copy["home.ctaBody"]}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">{copy["home.ctaContact"]}</ButtonLink>
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-soft hover:text-ink"
          >
            {site.email}
          </a>
        </div>
      </Reveal>
    </Container>
  );
}
