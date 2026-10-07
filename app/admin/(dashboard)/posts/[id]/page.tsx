import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) notFound();

  return (
    <div className="max-w-[860px]">
      <h1 className="text-3xl">Edit post</h1>
      <p className="mt-2 mb-8 text-soft">/{post.slug}</p>
      <PostForm
        post={{
          ...post,
          publishedAt: post.publishedAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
