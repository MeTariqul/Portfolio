"use client";

import { useActionState, useEffect, useRef } from "react";
import { createApp } from "@/app/admin/(dashboard)/apps/actions";
import { CopyText } from "@/components/admin/copy-text";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

// Registers a new app. On success it shows the slug and API key — the key
// is what the app sends as x-app-key, so it is the one thing to copy out
// before moving on (it stays revealable on the app's page afterwards).
//
// The slug field follows the name until you type in it yourself. That is
// done by writing to the input directly rather than through React state,
// which keeps a plain uncontrolled form working without a re-render per
// keystroke.
export function AppForm() {
  const [state, action, pending] = useActionState(createApp, {});
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (state.apiKey) {
      formRef.current?.reset();
      slugTouched.current = false;
    }
  }, [state.apiKey]);

  function onNameChange() {
    if (slugTouched.current || !nameRef.current || !slugRef.current) return;
    slugRef.current.value = slugify(nameRef.current.value);
  }

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-line bg-surface p-5">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1.5fr]">
        <div>
          <label htmlFor="app-name" className="mb-1.5 block text-sm text-soft">
            App name
          </label>
          <input
            id="app-name"
            name="name"
            required
            maxLength={80}
            ref={nameRef}
            onChange={onNameChange}
            placeholder="Notes Pro"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="app-slug" className="mb-1.5 block text-sm text-soft">
            Slug
          </label>
          <input
            id="app-slug"
            name="slug"
            required
            maxLength={30}
            ref={slugRef}
            onChange={() => {
              slugTouched.current = true;
            }}
            placeholder="notes-pro"
            pattern="[a-z0-9-]+"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-soft">Prefixes license keys (NOTES-XXXX-…).</p>
        </div>
        <div>
          <label htmlFor="app-description" className="mb-1.5 block text-sm text-soft">
            Description <span className="text-soft/70">(optional)</span>
          </label>
          <input
            id="app-description"
            name="description"
            maxLength={300}
            placeholder="What it is, where it ships"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create app"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm text-accent">
            {state.error}
          </p>
        )}
        {state.apiKey && (
          <p className="flex flex-wrap items-center gap-3 text-sm text-soft">
            <span>API key for {state.slug}:</span>
            <code className="rounded-md border border-line px-2 py-1 font-mono text-xs text-ink">
              {state.apiKey}
            </code>
            <CopyText text={state.apiKey} label="Copy key" />
          </p>
        )}
      </div>
    </form>
  );
}
