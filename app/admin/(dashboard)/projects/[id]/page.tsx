import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata: Metadata = {
  title: "Edit project",
  robots: { index: false, follow: false },
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="max-w-[860px]">
      <h1 className="text-3xl">Edit project</h1>
      <p className="mt-2 mb-8 text-soft">/{project.slug}</p>
      <ProjectForm
        project={{
          ...project,
          screenshots:
            (project.screenshots as { url: string; alt: string }[]) ?? [],
        }}
      />
    </div>
  );
}
