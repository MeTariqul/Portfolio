import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpec } from "@/lib/content-specs";
import { ContentForm } from "@/components/admin/content-form";

type Props = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  const spec = getSpec(kind);
  return {
    title: spec ? `New ${spec.singular}` : "New",
    robots: { index: false, follow: false },
  };
}

export default async function NewContentPage({ params }: Props) {
  const { kind } = await params;
  const spec = getSpec(kind);
  if (!spec) notFound();

  return (
    <div className="max-w-[760px]">
      <h1 className="text-3xl">New {spec.singular}</h1>
      <p className="mt-2 mb-8 text-soft">
        Saved rows appear on the site within a minute.
      </p>
      <ContentForm spec={spec} />
    </div>
  );
}
