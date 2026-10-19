"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBan, type BanFormState } from "@/app/admin/(dashboard)/apps/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none";

// Adds a ban by hand. Email bans are matched case-insensitively; device ids
// must match the fingerprint the software sends exactly.
export function BanForm() {
  const [state, action, pending] = useActionState<BanFormState, FormData>(
    createBan,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="grid gap-4 md:grid-cols-[10rem_1fr_1fr]">
        <div>
          <label htmlFor="ban-kind" className="mb-1.5 block text-sm text-soft">
            Ban by
          </label>
          <select id="ban-kind" name="kind" className={inputClass} defaultValue="EMAIL">
            <option value="EMAIL">Email address</option>
            <option value="DEVICE">Device id</option>
          </select>
        </div>
        <div>
          <label htmlFor="ban-value" className="mb-1.5 block text-sm text-soft">
            Value
          </label>
          <input
            id="ban-value"
            name="value"
            required
            maxLength={200}
            placeholder="someone@example.com, or the device id"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ban-reason" className="mb-1.5 block text-sm text-soft">
            Reason <span className="text-soft/70">(optional)</span>
          </label>
          <input
            id="ban-reason"
            name="reason"
            maxLength={200}
            placeholder="Chargeback, piracy, abuse…"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add ban"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm text-accent">
            {state.error}
          </p>
        )}
        {state.ok && !state.error && (
          <p className="text-sm text-soft">Ban added.</p>
        )}
      </div>
    </form>
  );
}
