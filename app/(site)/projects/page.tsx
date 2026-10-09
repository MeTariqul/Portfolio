import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProjectFilter } from "@/components/project-filter";
import { getProjects, getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["projects.title"],
    description: copy["projects.metaDescription"],
  };
}

export const revalidate = 60;

export default async function ProjectsPage() {
  const [projects, copy] = await Promise.all([getProjects(), getCopy()]);

  return (
    <Container>
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
