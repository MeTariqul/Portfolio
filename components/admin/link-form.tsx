"use client";

import { useActionState, useEffect, useRef } from "react";
import { createShortLink } from "@/app/admin/(dashboard)/links/actions";
import { CopyUrl } from "@/components/admin/copy-url";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none";

// "New short link" form. On success it keeps showing the finished URL with
// a copy button and clears the fields, so several links can be made in a
// row without a reload.
export function LinkForm() {
  const [state, action, pending] = useActionState(createShortLink, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.url) formRef.current?.reset();
  }, [state.url]);

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-line bg-surface p-5">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label htmlFor="targetUrl" className="mb-1.5 block text-sm text-soft">
            Link to shorten
          </label>
          <input
            id="targetUrl"
            name="targetUrl"
            type="url"
            required
            placeholder="https://example.com/very/long/path"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm text-soft">
            Title <span className="text-soft/70">(optional)</span>
          </label>
          <input
            id="title"
            name="title"
            maxLength={120}
            placeholder="Campaign, client…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm text-soft">
            Custom code <span className="text-soft/70">(optional)</span>
          </label>
          <input
            id="code"
            name="code"
            maxLength={60}
            placeholder="auto-generated"
            pattern="[a-zA-Z0-9_-]*"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Creating…" : "Create short link"}
        </Button>

        {state.error && (
          <p role="alert" className="text-sm text-accent">
            {state.error}
          </p>
        )}
        {state.url && (
          <p className="flex items-center gap-3 text-sm text-soft">
            <span className="rounded-md border border-line px-2 py-1 font-mono text-xs text-ink">
              {state.url.replace(/^https?:\/\//, "")}
            </span>
            <CopyUrl url={state.url} />
          </p>
        )}
      </div>
    </form>
  );
}
