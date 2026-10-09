import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { COPY_FIELDS } from "@/lib/copy";
import { CopyForm } from "@/components/admin/copy-form";

export const metadata: Metadata = {
  title: "Copy",
  robots: { index: false, follow: false },
};

export default async function CopyPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const row = await prisma.setting.findUnique({ where: { key: "copy" } });
  const stored = (row?.value ?? {}) as Record<string, unknown>;

  // Only known keys with non-empty strings make it onto the form; anything
  // else in the row (an old key, a bad write) is ignored.
  const values: Record<string, string> = {};
  for (const f of COPY_FIELDS) {
    const v = stored[f.key];
    if (typeof v === "string" && v !== "") values[f.key] = v;
  }

  return (
    <div>
      <h1 className="text-3xl">Copy</h1>
      <p className="mt-2 mb-2 max-w-[680px] text-soft">
        Every word on the public site. Clear a field to return it to its
        default.
      </p>
      <p className="mb-8 max-w-[680px] text-sm text-soft">
        Not here: the home headline, intro, availability note and about story
        (Settings screen); posts, projects and the content rows under
        Services, Experience, Skills and Uses (their own screens).
      </p>

      {saved && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
        >
          Copy saved. The site updates within a minute.
        </p>
      )}

      <CopyForm values={values} />
    </div>
  );
}
