"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadMedia, type UploadState } from "@/app/admin/(dashboard)/media/actions";

const input =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-soft focus:border-accent focus:outline-none";

export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(
    uploadMedia,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="file" className="mb-1.5 block text-sm text-soft">
            Image
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*"
            required
            className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-contrast"
          />
        </div>
        <div>
          <label htmlFor="alt" className="mb-1.5 block text-sm text-soft">
            Alt text (required)
          </label>
          <input
            id="alt"
            name="alt"
            required
            minLength={2}
            maxLength={300}
            placeholder="Describe what the image shows"
            className={input}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-soft">
          Uploaded. The URL is below; copy it into any content field.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
