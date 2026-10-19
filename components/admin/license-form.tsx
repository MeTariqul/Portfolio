"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLicense } from "@/app/admin/(dashboard)/apps/actions";
import { CopyText } from "@/components/admin/copy-text";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none";

// Issues a license key for an app. An empty key field means "generate
// one"; the finished key is shown with a copy button so it can be handed
// to the customer straight away.
export function LicenseForm({ appId }: { appId: string }) {
  const [state, action, pending] = useActionState(createLicense, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.key) formRef.current?.reset();
  }, [state.key]);

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-line bg-surface p-5">
      <input type="hidden" name="appId" value={appId} />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="lic-label" className="mb-1.5 block text-sm text-soft">
            Customer <span className="text-soft/70">(optional)</span>
          </label>
          <input id="lic-label" name="label" maxLength={120} placeholder="Name or order ref" className={inputClass} />
        </div>
        <div>
          <label htmlFor="lic-email" className="mb-1.5 block text-sm text-soft">
            Email <span className="text-soft/70">(optional)</span>
          </label>
          <input id="lic-email" name="email" type="email" maxLength={200} placeholder="buyer@example.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor="lic-key" className="mb-1.5 block text-sm text-soft">
            Custom key <span className="text-soft/70">(optional)</span>
          </label>
          <input id="lic-key" name="customKey" maxLength={60} placeholder="generated when empty" className={inputClass} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="lic-devices" className="mb-1.5 block text-sm text-soft">
            Device slots
          </label>
          <input
            id="lic-devices"
            name="maxDevices"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lic-expires" className="mb-1.5 block text-sm text-soft">
            Expires <span className="text-soft/70">(empty = lifetime)</span>
          </label>
          <input id="lic-expires" name="expiresAt" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="lic-notes" className="mb-1.5 block text-sm text-soft">
            Notes <span className="text-soft/70">(optional)</span>
          </label>
          <input id="lic-notes" name="notes" maxLength={2000} placeholder="Private note" className={inputClass} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Issuing…" : "Issue license"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm text-accent">
            {state.error}
          </p>
        )}
        {state.key && (
          <p className="flex flex-wrap items-center gap-3 text-sm text-soft">
            <span>New key:</span>
            <code className="rounded-md border border-line px-2 py-1 font-mono text-xs text-ink">
              {state.key}
            </code>
            <CopyText text={state.key} label="Copy key" />
          </p>
        )}
      </div>
    </form>
  );
}
