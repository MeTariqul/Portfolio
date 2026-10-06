import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProjectFilter } from "@/components/project-filter";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Case studies of web apps, tools and automations built by Md. Tariqul Islam.",
};

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="max-w-[680px] text-4xl">Projects</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          Each one started as a problem worth solving. Open a project to read
          the full story: the problem, what I built, and what I took away.
        </p>
        <div className="mt-12">
          <ProjectFilter projects={projects} />
        </div>
      </section>
    </Container>
  );
}
