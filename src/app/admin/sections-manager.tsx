"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  deleteExperienceItem,
  deleteProcessStep,
  deleteService,
  deleteTestimonial,
  getSection,
  listExperience,
  listProcessSteps,
  listServices,
  listTestimonials,
  saveExperienceItem,
  saveProcessStep,
  saveSection,
  saveService,
  saveTestimonial,
  type AdminExperienceItem,
  type AdminProcessStep,
  type AdminService,
  type AdminTestimonial,
} from "@/app/actions/admin";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

type Row = Record<string, unknown> & { id: string };

type FieldDef = {
  key: string;
  label: string;
  textarea?: boolean;
  number?: boolean;
  tags?: boolean;
};

type ListTab = "services" | "process" | "experience" | "testimonials";
type SectionTab = ListTab | "hero" | "about";

const LIST_TABS: { id: SectionTab; label: string }[] = [
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "experience", label: "Experience" },
  { id: "testimonials", label: "Testimonials" },
];

const SINGLE_TABS: { id: SectionTab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
];

const FIELDS: Record<string, FieldDef[]> = {
  services: [
    { key: "title", label: "Title" },
    { key: "desc", label: "Description", textarea: true },
    { key: "tags", label: "Tags (comma-separated)", tags: true },
  ],
  process: [
    { key: "title", label: "Title" },
    { key: "desc", label: "Description", textarea: true },
  ],
  experience: [
    { key: "role", label: "Role" },
    { key: "org", label: "Organization" },
    { key: "period", label: "Period" },
    { key: "desc", label: "Description", textarea: true },
  ],
  testimonials: [
    { key: "quote", label: "Quote", textarea: true },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "rating", label: "Rating (1-5)", number: true },
  ],
};

function emptyRow(tab: ListTab): Row {
  switch (tab) {
    case "services":
      return { id: "", title: "", desc: "", tags: [], sort: 0 };
    case "process":
      return { id: "", title: "", desc: "", sort: 0 };
    case "experience":
      return { id: "", role: "", org: "", period: "", desc: "", sort: 0 };
    case "testimonials":
      return { id: "", quote: "", name: "", role: "", rating: 5, sort: 0 };
  }
}

function fetchRows(tab: ListTab) {
  switch (tab) {
    case "services":
      return listServices();
    case "process":
      return listProcessSteps();
    case "experience":
      return listExperience();
    case "testimonials":
      return listTestimonials();
  }
}

function saveRow(tab: ListTab, row: Row) {
  switch (tab) {
    case "services":
      return saveService(row as unknown as AdminService);
    case "process":
      return saveProcessStep(row as unknown as AdminProcessStep);
    case "experience":
      return saveExperienceItem(row as unknown as AdminExperienceItem);
    case "testimonials":
      return saveTestimonial(row as unknown as AdminTestimonial);
  }
}

function deleteRow(tab: ListTab, id: string) {
  switch (tab) {
    case "services":
      return deleteService(id);
    case "process":
      return deleteProcessStep(id);
    case "experience":
      return deleteExperienceItem(id);
    case "testimonials":
      return deleteTestimonial(id);
  }
}

function fieldValue(row: Row, field: FieldDef): string {
  if (field.tags) return ((row.tags as string[]) ?? []).join(", ");
  if (field.number) return String(row[field.key] ?? 0);
  return String(row[field.key] ?? "");
}

function ListEditor({
  tab,
  title,
}: {
  tab: ListTab;
  title: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fields = FIELDS[tab];

  useEffect(() => {
    fetchRows(tab).then((res) => {
      if (res.ok && res.rows) {
        setRows(res.rows as Row[]);
        setError("");
      } else if (!res.ok) {
        setRows([]);
        setError(res.error);
      }
    });
  }, [tab]);

  async function refresh() {
    const res = await fetchRows(tab);
    if (res.ok && res.rows) {
      setRows(res.rows as Row[]);
      setError("");
    } else if (!res.ok) {
      setRows([]);
      setError(res.error);
    }
  }

  function setField(key: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const res = await saveRow(tab, editing);
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteRow(tab, id);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  const primary = fields[0];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
          {rows ? `${rows.length} items` : title}
        </p>
        <button
          onClick={() => setEditing(emptyRow(tab))}
          className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New item
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-3xl border border-line bg-surface p-6"
        >
          {fields.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              {field.textarea || field.tags ? (
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={field.tags ? 2 : 3}
                  value={fieldValue(editing, field)}
                  onChange={(e) =>
                    setField(
                      field.key,
                      field.tags
                        ? e.target.value.split(",")
                        : e.target.value
                    )
                  }
                />
              ) : (
                <input
                  type={field.number ? "number" : "text"}
                  className={inputClass}
                  value={fieldValue(editing, field)}
                  onChange={(e) =>
                    setField(
                      field.key,
                      field.number ? Number(e.target.value) : e.target.value
                    )
                  }
                />
              )}
            </div>
          ))}
          <div>
            <label className={labelClass}>Sort order</label>
            <input
              type="number"
              className={inputClass}
              value={fieldValue(editing, { key: "sort", label: "Sort" })}
              onChange={(e) => setField("sort", Number(e.target.value))}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing.id ? "Save changes" : "Create item"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-2xl border border-line px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : rows === null ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          No items yet. Add the first one — the site falls back to en.json until then.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={String(row.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-ink">
                  {String(row[primary.key] ?? "Untitled")}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-soft">
                  sort {String(row.sort ?? 0)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ ...row })}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
                >
                  <Edit3 className="h-4 w-4" aria-hidden />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(String(row.id))}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinesField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        className={`${inputClass} resize-none font-mono text-xs`}
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function HeroEditor() {
  const [roles, setRoles] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSection("hero").then((res) => {
      if (res.ok && res.value) {
        setRoles((res.value.roles as string[] | undefined)?.join("\n") ?? "");
        setSubtitle(String(res.value.subtitle ?? ""));
        setStatus(String(res.value.status ?? ""));
      } else if (!res.ok) {
        setError(res.error);
      }
      setLoaded(true);
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSection("hero", {
      roles: roles.split("\n").map((r) => r.trim()).filter(Boolean),
      subtitle: subtitle.trim(),
      status: status.trim(),
    });
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
        {error && (
          <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <LinesField
          label="Rotating roles (one per line)"
          value={roles}
          onChange={setRoles}
        />
        <div className="mt-4">
          <label className={labelClass}>Subtitle</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className={labelClass}>Status pill</label>
          <input
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !loaded}
            className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save hero"}
          </button>
          {saved && <p className="text-sm text-emerald-400">Saved</p>}
        </div>
      </div>
    </form>
  );
}

type StatRow = { value: number; suffix: string; label: string };

function AboutEditor() {
  const [stats, setStats] = useState<StatRow[]>([]);
  const [badges, setBadges] = useState("");
  const [terminalLines, setTerminalLines] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSection("about").then((res) => {
      if (res.ok && res.value) {
        setStats(
          ((res.value.stats as StatRow[] | undefined) ?? []).map((s) => ({
            value: Number(s.value ?? 0),
            suffix: String(s.suffix ?? ""),
            label: String(s.label ?? ""),
          }))
        );
        setBadges((res.value.badges as string[] | undefined)?.join("\n") ?? "");
        setTerminalLines(
          (res.value.terminalLines as string[] | undefined)?.join("\n") ?? ""
        );
      } else if (!res.ok) {
        setError(res.error);
      }
      setLoaded(true);
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSection("about", {
      stats: stats.filter((s) => s.label.trim()),
      badges: badges.split("\n").map((b) => b.trim()).filter(Boolean),
      terminalLines: terminalLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
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
        {error && (
          <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div>
          <p className={labelClass}>Counters</p>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-2xl border border-line bg-bg/60 p-4 sm:grid-cols-[8rem_6rem_1fr_auto]"
              >
                <input
                  type="number"
                  className={inputClass}
                  placeholder="12"
                  value={String(s.value)}
                  onChange={(e) =>
                    setStats(
                      stats.map((x, j) =>
                        j === i ? { ...x, value: Number(e.target.value) } : x
                      )
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="+"
                  value={s.suffix}
                  onChange={(e) =>
                    setStats(
                      stats.map((x, j) =>
                        j === i ? { ...x, suffix: e.target.value } : x
                      )
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Projects shipped"
                  value={s.label}
                  onChange={(e) =>
                    setStats(
                      stats.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setStats(stats.filter((_, j) => j !== i))}
                  className="flex items-center justify-center rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setStats([...stats, { value: 0, suffix: "+", label: "" }])
              }
              className="flex items-center gap-2 rounded-2xl border border-line bg-bg px-4 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add counter
            </button>
          </div>
        </div>

        <div className="mt-4">
          <LinesField
            label="Badges (one per line)"
            value={badges}
            onChange={setBadges}
          />
        </div>

        <div className="mt-4">
          <LinesField
            label="Terminal lines (one per line)"
            value={terminalLines}
            onChange={setTerminalLines}
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !loaded}
            className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save about"}
          </button>
          {saved && <p className="text-sm text-emerald-400">Saved</p>}
        </div>
      </div>
    </form>
  );
}

export function SectionsManager() {
  const [tab, setTab] = useState<SectionTab>("services");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[...LIST_TABS, ...SINGLE_TABS].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-2xl px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t.id
                ? "bg-ink text-bg"
                : "border border-line bg-surface text-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "services" && <ListEditor tab="services" title="Services" />}
      {tab === "process" && <ListEditor tab="process" title="Process" />}
      {tab === "experience" && <ListEditor tab="experience" title="Experience" />}
      {tab === "testimonials" && <ListEditor tab="testimonials" title="Testimonials" />}
      {tab === "hero" && <HeroEditor />}
      {tab === "about" && <AboutEditor />}
    </div>
  );
}