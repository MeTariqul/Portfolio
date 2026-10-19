import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectsManual } from "@/components/admin/projects-manual";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export default function NewProjectPage() {
  return (
    <div className="max-w-[860px]">
      <h1 className="text-3xl">New project</h1>
      <p className="mt-2 text-soft">
        A case study: the problem, what you built, what you learned.
      </p>
      <ProjectsManual className="mt-6 mb-8" />
      <ProjectForm />
    </div>
  );
}
