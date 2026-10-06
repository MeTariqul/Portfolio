import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

export default function HomePage() {
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
            className="inline-block h-2 w-2 rounded-full bg-accent"
            aria-hidden
          />
          Available for new work
        </p>

        <h1 className="max-w-[680px] text-4xl md:text-5xl">
          I build websites and web apps for people and small teams.
        </h1>

        <p className="mt-6 max-w-[680px] text-lg text-soft">
          I&apos;m {site.name}, a web developer from {site.location}. I work
          with Next.js, React, TypeScript, Python, Django and PostgreSQL. I
          also take freelance work on Fiverr.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="/contact">Start a project</ButtonLink>
          <Link
            href="/projects"
            className="link-underline text-soft hover:text-ink"
          >
            See my work
          </Link>
        </div>
      </section>
    </Container>
  );
}
