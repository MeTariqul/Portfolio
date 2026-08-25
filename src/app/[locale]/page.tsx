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
import { PersonJsonLd } from "@/components/person-json-ld";
import type { SkillsRings } from "@/components/skills";
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
  getSite,
  getSiteContent,
  getTestimonials,
} from "@/lib/content";
import { getMetaContent } from "@/lib/messages";

export const revalidate = 60;

function withItems<T>(rows: T[] | null | undefined): T[] | undefined {
  if (rows === null || rows === undefined) return undefined;
  return rows;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const meta = await getMetaContent();

  const title = meta.title ?? t("title");
  const description = meta.description ?? t("description");
  const ogDescription = meta.ogDescription ?? t("ogDescription");

  return {
    title: {
      default: title,
      template: "%s | Md. Tariqul Islam",
    },
    description,
    keywords: [
      "Md. Tariqul Islam",
      "Tariqul Islam",
      "Full-Stack Developer",
      "Next.js Developer",
      "React Developer",
      "TypeScript Developer",
      "Python Developer",
      "Django Developer",
      "AI Web Developer",
      "Web Developer Bangladesh",
      "Dhaka Developer",
      "Savar Developer",
      "Portfolio",
      "SEO-friendly Web Developer",
    ],
    alternates: {
      canonical: `${site.url}/${locale}`,
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `${site.url}/${locale}`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Md. Tariqul Islam — Full-Stack Web Developer in Bangladesh",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: ["/opengraph.png"],
    },
    icons: {
      icon: "/icon.svg",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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

  const [dbPosts, dbProjects, dbSettings, dbServices, dbProcess, dbExperience, dbTestimonials, dbHero, dbAbout, dbContent, dbSite] =
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
      getSiteContent(),
      getSite(),
    ]);
  const contactSettings = dbSettings?.contact;
  const heroRoles = dbHero?.roles?.length ? dbHero.roles : undefined;
  const marqueeItems = (dbContent?.marquee?.items as string[] | undefined)?.filter(
    (i) => i.trim()
  );
  const wordBuild = dbContent?.wordDividers?.build as string[] | undefined;
  const wordDesign = dbContent?.wordDividers?.design as string[] | undefined;
  const rings = dbContent?.skills?.rings as SkillsRings | undefined;

  return (
    <>
      <PersonJsonLd />
      <Preloader waitForScenes />
      <Hero roles={heroRoles} subtitle={dbHero?.subtitle} status={dbHero?.status} siteProfile={dbSite} />
      <Marquee items={marqueeItems} />
      <Statement />
      <About
        stats={dbAbout?.stats}
        badges={dbAbout?.badges}
        terminalLines={dbAbout?.terminalLines}
        location={dbSite.location}
      />
      <Services items={withItems(dbServices)} />
      <WordDivider words={wordBuild?.length ? wordBuild : ["Build", "Create", "Ship"]} />
      <Projects items={withItems(dbProjects)} githubUrl={dbSite.github} />
      <Skills rings={rings} />
      <Process items={withItems(dbProcess)} />
      <Experience items={withItems(dbExperience)} />
      <WordDivider words={wordDesign?.length ? wordDesign : ["Design", "Code", "Repeat"]} />
      <BlogSection posts={withItems(dbPosts)} />
      <Testimonials items={withItems(dbTestimonials)} />
      <CtaBand />
      <Contact settings={contactSettings} siteProfile={dbSite} />
    </>
  );
}
