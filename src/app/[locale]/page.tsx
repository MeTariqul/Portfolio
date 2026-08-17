import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Preloader } from "@/components/preloader";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Statement } from "@/components/statement";
import { About } from "@/components/about";
import { Services } from "@/components/services";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { Process } from "@/components/process";
import { Experience } from "@/components/experience";
import { BlogSection } from "@/components/blog-section";
import { Testimonials } from "@/components/testimonials";
import { CtaBand } from "@/components/cta-band";
import { Contact } from "@/components/contact";
import { WordDivider } from "@/components/word-divider";
import { site } from "@/lib/site";
import {
  getAbout,
  getBlogPosts,
  getExperience,
  getHero,
  getProcessSteps,
  getProjects,
  getServices,
  getSettings,
  getTestimonials,
} from "@/lib/content";

export const revalidate = 60;

function withItems<T>(rows: T[] | null | undefined): T[] | undefined {
  return rows && rows.length > 0 ? rows : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      default: t("title"),
      template: "%s | Md. Tariqul Islam",
    },
    description: t("description"),
    alternates: {
      canonical: `${site.url}/${locale}`,
    },
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      url: `${site.url}/${locale}`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Md. Tariqul Islam — Full-Stack Web Developer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("ogDescription"),
      images: ["/opengraph.png"],
    },
    icons: {
      icon: "/icon.svg",
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [dbPosts, dbProjects, dbSettings, dbServices, dbProcess, dbExperience, dbTestimonials, dbHero, dbAbout] =
    await Promise.all([
      getBlogPosts(),
      getProjects(),
      getSettings(),
      getServices(),
      getProcessSteps(),
      getExperience(),
      getTestimonials(),
      getHero(),
      getAbout(),
    ]);
  const contactSettings = dbSettings?.contact;
  const heroRoles = dbHero?.roles?.length ? dbHero.roles : undefined;

  return (
    <>
      <Preloader waitForScenes />
      <Hero roles={heroRoles} subtitle={dbHero?.subtitle} status={dbHero?.status} />
      <Marquee />
      <Statement />
      <About
        stats={dbAbout?.stats}
        badges={dbAbout?.badges}
        terminalLines={dbAbout?.terminalLines}
      />
      <Services items={withItems(dbServices)} />
      <WordDivider words={["Build", "Create", "Ship"]} />
      <Projects items={withItems(dbProjects)} />
      <Skills />
      <Process items={withItems(dbProcess)} />
      <Experience items={withItems(dbExperience)} />
      <WordDivider words={["Design", "Code", "Repeat"]} />
      <BlogSection posts={withItems(dbPosts)} />
      <Testimonials items={withItems(dbTestimonials)} />
      <CtaBand />
      <Contact settings={contactSettings} />
    </>
  );
}
