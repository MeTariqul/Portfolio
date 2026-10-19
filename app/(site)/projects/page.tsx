import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProjectFilter } from "@/components/project-filter";
import { JsonLd } from "@/components/seo/json-ld";
import { itemListJsonLd } from "@/lib/seo";
import { getProjects, getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["projects.title"],
    description: copy["projects.metaDescription"],
    alternates: { canonical: "/projects" },
  };
}

export const revalidate = 60;

export default async function ProjectsPage() {
  const [projects, copy] = await Promise.all([getProjects(), getCopy()]);

  // The list, in order, as structured data — so a search engine can see
  // which project is which instead of only a page of links.
  const jsonLd = itemListJsonLd({
    name: copy["projects.title"],
    path: "/projects",
    items: projects.map((p) => ({
      name: p.title,
      path: `/projects/${p.slug}`,
      description: p.summary,
    })),
  });

  return (
    <Container>
      <JsonLd data={jsonLd} />
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">{copy["projects.title"]}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          {copy["projects.intro"]}
        </p>
        <div className="mt-12">
          <ProjectFilter
            projects={projects}
            labels={{
              all: copy["ui.all"],
              categoryAria: copy["projects.filterCategory"],
              techAria: copy["projects.filterTech"],
              shownSr: copy["projects.shownSr"],
              empty: copy["projects.empty"],
              noMatch: copy["projects.noMatch"],
            }}
          />
        </div>
      </section>
    </Container>
  );
}
