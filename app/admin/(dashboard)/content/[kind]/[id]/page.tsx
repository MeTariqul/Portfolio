import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpec } from "@/lib/content-specs";
import { getRow } from "@/lib/content-rows";
import { ContentForm } from "@/components/admin/content-form";

type Props = { params: Promise<{ kind: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  const spec = getSpec(kind);
  return {
    title: spec ? `Edit ${spec.singular}` : "Edit",
    robots: { index: false, follow: false },
  };
}

export default async function EditContentPage({ params }: Props) {
  const { kind, id } = await params;
  const spec = getSpec(kind);
  if (!spec) notFound();

  const row = await getRow(spec, id);
  if (!row) notFound();

  // Rows arrive as database objects; the form speaks plain strings.
  const initial: Record<string, string> = { id: row.id };
  for (const f of spec.fields) {
    const v = row[f.key];
    initial[f.key] = v == null ? "" : String(v);
  }

  return (
    <div className="max-w-[760px]">
      <h1 className="text-3xl">Edit {spec.singular}</h1>
      <p className="mt-2 mb-8 text-soft">
        {spec.preview
          .map((key) => String(row[key] ?? ""))
          .filter(Boolean)
          .join(" · ")}
      </p>
      <ContentForm spec={spec} initial={initial} />
    </div>
  );
}
