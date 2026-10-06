"use client";

import { useActionState } from "react";
import {
  saveSiteSettings,
  changePassword,
  type SettingsState,
} from "@/app/admin/(dashboard)/settings/actions";

const input =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-soft focus:border-accent focus:outline-none";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-soft">
      {children}
    </label>
  );
}

export function SiteSettingsForm({
  initial,
}: {
  initial: {
    available: boolean;
    availabilityNote: string;
    homeRole: string;
    homeIntro: string;
    aboutStory: string;
    aboutInterests: string;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveSiteSettings,
    {},
  );

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="availabilityNote">Availability note</Label>
          <input
            id="availabilityNote"
            name="availabilityNote"
            required
            maxLength={200}
            defaultValue={initial.availabilityNote}
            className={input}
          />
        </div>
        <label className="flex h-fit items-center gap-2 self-end pb-3 text-sm">
          <input
            type="checkbox"
            name="available"
            defaultChecked={initial.available}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Available for work (green dot on the home page)
        </label>
      </div>

      <div>
        <Label htmlFor="homeRole">Home headline</Label>
        <input
          id="homeRole"
          name="homeRole"
          required
          maxLength={200}
          defaultValue={initial.homeRole}
          className={input}
        />
      </div>

      <div>
        <Label htmlFor="homeIntro">Home intro paragraph</Label>
        <textarea
          id="homeIntro"
          name="homeIntro"
          required
          rows={3}
          maxLength={600}
          defaultValue={initial.homeIntro}
          className={input}
        />
      </div>

      <div>
        <Label htmlFor="aboutStory">
          About story (paragraphs separated by a blank line)
        </Label>
        <textarea
          id="aboutStory"
          name="aboutStory"
          required
          rows={8}
          defaultValue={initial.aboutStory}
          className={input}
        />
      </div>

      <div>
        <Label htmlFor="aboutInterests">Interests (one per line)</Label>
        <textarea
          id="aboutInterests"
          name="aboutInterests"
          required
          rows={4}
          defaultValue={initial.aboutInterests}
          className={input}
        />
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
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="current">Current password</Label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className={input}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="next">New password</Label>
          <input
            id="next"
            name="next"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={input}
          />
        </div>
        <div>
          <Label htmlFor="confirm">Repeat new password</Label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={input}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium text-ink transition-colors hover:border-accent disabled:opacity-50"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
