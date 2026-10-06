import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export default function NewProjectPage() {
  return (
    <div className="max-w-[860px]">
      <h1 className="text-3xl">New project</h1>
      <p className="mt-2 mb-8 text-soft">
        A case study: the problem, what you built, what you learned.
      </p>
      <ProjectForm />
    </div>
  );
}
