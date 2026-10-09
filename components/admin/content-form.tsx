"use client";

import { useActionState } from "react";
import {
  saveContent,
  type ContentFormState,
} from "@/app/admin/(dashboard)/content/actions";
import type { ContentSpec, FieldSpec } from "@/lib/content-specs";

const input =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-soft focus:border-accent focus:outline-none";

// One form for every simple content type: fields come from the spec, so
// Services, Experience, Skills and Uses share the exact same behaviour.
export function ContentForm({
  spec,
  initial,
}: {
  spec: ContentSpec;
  initial?: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<ContentFormState, FormData>(
    saveContent,
    {},
  );

  const id = initial?.id;
  const value = (f: FieldSpec) => initial?.[f.key] ?? "";

  const label = (f: FieldSpec) => (
    <label
      htmlFor={`${spec.kind}-${f.key}`}
      className="mb-1.5 block text-sm text-soft"
    >
      {f.label}
    </label>
  );

  const help = (f: FieldSpec) =>
    f.help ? (
      <p className="mt-1 text-xs text-soft">{f.help}</p>
    ) : null;

  return (
    <form action={action} className="space-y-5">
      {/* Field names carry an `f.` prefix so no spec field can ever collide
          with the routing inputs above (Experience has a field named "kind"). */}
      <input type="hidden" name="kind" value={spec.kind} />
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid gap-5 md:grid-cols-2">
        {spec.fields.map((f) =>
          f.type === "textarea" ? (
            <div key={f.key} className="md:col-span-2">
              {label(f)}
              <textarea
                id={`${spec.kind}-${f.key}`}
                name={`f.${f.key}`}
                required={f.required}
                rows={f.rows ?? 4}
                defaultValue={value(f)}
                className={input}
              />
              {help(f)}
            </div>
          ) : f.type === "select" ? (
            <div key={f.key}>
              {label(f)}
              <select
                id={`${spec.kind}-${f.key}`}
                name={`f.${f.key}`}
                required={f.required}
                defaultValue={value(f) || f.options?.[0]?.value || ""}
                className={input}
              >
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {help(f)}
            </div>
          ) : (
            <div key={f.key}>
              {label(f)}
              <input
                id={`${spec.kind}-${f.key}`}
                name={`f.${f.key}`}
                type={f.type === "number" ? "number" : "text"}
                required={f.required}
                maxLength={f.type === "number" ? undefined : f.max}
                defaultValue={value(f)}
                className={input}
              />
              {help(f)}
            </div>
          ),
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : `Save ${spec.singular}`}
      </button>
    </form>
  );
}
