"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const initialState: ContactState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContact,
    initialState,
  );

  if (state.status === "ok") {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-xl">Message sent</h2>
        <p className="mt-2 text-soft">{state.message}</p>
      </div>
    );
  }

  const err = (field: string) => state.errors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm text-soft">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          className={inputClass}
          aria-invalid={!!err("name")}
          aria-describedby={err("name") ? "name-error" : undefined}
        />
        {err("name") && (
          <p id="name-error" className="mt-1.5 text-sm text-accent">
            {err("name")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-soft">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className={inputClass}
          aria-invalid={!!err("email")}
          aria-describedby={err("email") ? "email-error" : undefined}
        />
        {err("email") && (
          <p id="email-error" className="mt-1.5 text-sm text-accent">
            {err("email")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm text-soft">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className={cn(inputClass, "resize-y")}
          aria-invalid={!!err("message")}
          aria-describedby={err("message") ? "message-error" : undefined}
        />
        {err("message") && (
          <p id="message-error" className="mt-1.5 text-sm text-accent">
            {err("message")}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people, tempting for bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-accent">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-[0.95rem] font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
