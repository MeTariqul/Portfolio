"use client";

import { useActionState } from "react";
import { saveCopy, type CopyState } from "@/app/admin/(dashboard)/copy/actions";
import {
  COPY_FIELDS,
  COPY_GROUPS,
  type CopyFieldInfo,
} from "@/lib/copy";

const input =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-soft focus:border-accent focus:outline-none";

// The whole site's wording, grouped the way the pages are. An empty field
// means "use the default"; the default sits in the placeholder (empty
// fields) or under the field (edited ones).
export function CopyForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<CopyState, FormData>(
    saveCopy,
    {},
  );

  return (
    <form action={action} className="space-y-12">
      {COPY_GROUPS.map((group) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h2
            id={`group-${group}`}
            className="border-t border-line pt-6 text-xl first:border-t-0 first:pt-0"
          >
            {group}
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {COPY_FIELDS.filter((field) => field.group === group).map(
              (raw) => {
                // Read the as-const entry through the widened field shape
                // so optional properties (long, help) are accessible.
                const f: CopyFieldInfo = raw;
                const current = values[f.key] ?? "";
                return (
                <div key={f.key} className={f.long ? "md:col-span-2" : ""}>
                  <label
                    htmlFor={`c-${f.key}`}
                    className="mb-1.5 block text-sm text-soft"
                  >
                    {f.label}
                  </label>
                  {f.long ? (
                    <textarea
                      id={`c-${f.key}`}
                      name={`c.${f.key}`}
                      rows={3}
                      defaultValue={current}
                      placeholder={f.def}
                      className={input}
                    />
                  ) : (
                    <input
                      id={`c-${f.key}`}
                      name={`c.${f.key}`}
                      type="text"
                      defaultValue={current}
                      placeholder={f.def}
                      className={input}
                    />
                  )}
                  {f.help && <p className="mt-1 text-xs text-soft">{f.help}</p>}
                  {current !== "" && (
                    <p className="mt-1 truncate text-xs text-soft">
                      Default: {f.def}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}

      <div className="border-t border-line pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save copy"}
        </button>
        <p className="mt-3 text-sm text-soft">
          Empty fields fall back to the default wording. The site refreshes
          within a minute.
        </p>
      </div>
    </form>
  );
}
