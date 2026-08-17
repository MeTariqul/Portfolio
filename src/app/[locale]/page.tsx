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
  getBlogPosts,
  getProjects,
  getSettings,
} from "@/lib/content";

export const revalidate = 60;

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

  const [dbPosts, dbProjects, dbSettings] = await Promise.all([
    getBlogPosts(),
    getProjects(),
    getSettings(),
  ]);
  const contactSettings = dbSettings?.contact;

  return (
    <>
      <Preloader waitForScenes />
      <Hero />
      <Marquee />
      <Statement />
      <About />
      <Services />
      <WordDivider words={["Build", "Create", "Ship"]} />
      <Projects items={dbProjects ?? undefined} />
      <Skills />
      <Process />
      <Experience />
      <WordDivider words={["Design", "Code", "Repeat"]} />
      <BlogSection posts={dbPosts ?? undefined} />
      <Testimonials />
      <CtaBand />
      <Contact settings={contactSettings} />
    </>
  );
}
