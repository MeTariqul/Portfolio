import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "@/components/admin/upload-form";
import { deleteMedia } from "@/app/admin/(dashboard)/media/actions";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { CopyUrl } from "@/components/admin/copy-url";

export const metadata: Metadata = {
  title: "Media",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const items = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-[960px]">
      <h1 className="text-3xl">Media</h1>
      <p className="mt-2 text-soft">
        Images stored in Supabase Storage. Copy a URL into any content field.
      </p>

      <section className="mt-8 rounded-xl border border-line bg-surface p-6" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="text-lg">
          Upload image
        </h2>
        <div className="mt-4">
          <UploadForm />
        </div>
      </section>

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No uploads yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <figure
              key={m.id}
              className="overflow-hidden rounded-xl border border-line bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt}
                className="aspect-video w-full bg-line/30 object-cover"
                loading="lazy"
              />
              <figcaption className="p-4">
                <p className="truncate text-sm" title={m.filename}>
                  {m.filename}
                </p>
                <p className="mt-0.5 truncate text-xs text-soft" title={m.alt}>
                  {m.alt}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <CopyUrl url={m.url} />
                  <ConfirmForm
                    action={deleteMedia.bind(null, m.id)}
                    confirmText="Delete this image?"
                  >
                    <button
                      type="submit"
                      className="text-xs text-soft transition-colors hover:text-accent"
                    >
                      Delete
                    </button>
                  </ConfirmForm>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
