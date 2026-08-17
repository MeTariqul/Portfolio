"use client";

import { useEffect, useState } from "react";
import { getSettingsMap, saveContactSettings } from "@/app/actions/admin";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

export function SettingsManager() {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsMap().then((res) => {
      if (res.ok) {
        setEmail(res.contact?.email ?? "");
        setLocation(res.contact?.location ?? "");
        setAvailability(res.contact?.availability ?? "");
        setLoaded(true);
      } else if (!res.ok) {
        setError(res.error);
        setLoaded(true);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveContactSettings({ email, location, availability });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-3xl border border-line bg-surface p-6">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-soft">
          Contact info — shown in the contact section
        </p>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Savar, Dhaka, Bangladesh"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Availability</label>
          <input
            className={inputClass}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Currently open to freelance & full-time opportunities"
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !loaded}
            className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <p className="text-sm text-emerald-400">Saved</p>}
        </div>
      </div>
    </form>
  );
}