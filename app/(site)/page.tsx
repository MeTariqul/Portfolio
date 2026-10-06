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
} from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, projects, posts] = await Promise.all([
    getSettings(),
    getFeaturedProjects(3),
    getLatestPosts(3),
  ]);
  const { availability, home } = settings;

  return (
    <Container>
      <section className="py-20 md:py-28">
        <Image
          src="/profile.jpg"
          alt={`Portrait of ${site.name}`}
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
          <ButtonLink href="/contact">Start a project</ButtonLink>
          <Link href="/projects" className="link-underline text-soft hover:text-ink">
            See my work
          </Link>
        </div>
      </section>

      <Reveal as="section" className="pb-16" aria-labelledby="work-heading">
        <h2 id="work-heading" className="text-3xl">
          Selected work
        </h2>
        <div className="mt-6">
          {projects.map((p, i) => (
            <ProjectRow key={p.slug} project={p} index={i} />
          ))}
        </div>
        <p className="mt-6">
          <Link href="/projects" className="link-underline text-accent">
            All projects
          </Link>
        </p>
      </Reveal>

      <Reveal as="section" className="pb-16" aria-labelledby="writing-heading">
        <h2 id="writing-heading" className="text-3xl">
          Latest writing
        </h2>
        <div className="mt-6">
          {posts.map((p) => (
            <PostRow key={p.slug} post={p} />
          ))}
        </div>
        <p className="mt-6">
          <Link href="/blog" className="link-underline text-accent">
            All posts
          </Link>
        </p>
      </Reveal>

      <Reveal as="section" className="border-t border-line py-16" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="max-w-[680px] text-3xl">
          Have something you want built?
        </h2>
        <p className="mt-4 max-w-[680px] text-soft">
          Tell me what it is. I read every message and reply within a day.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">Get in touch</ButtonLink>
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
