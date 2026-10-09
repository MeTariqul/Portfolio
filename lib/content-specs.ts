// Declarative descriptions of the admin's simple content types
// (Services, Experience, Skills, Uses). Pure data: the client form imports
// this file, so it must never touch the database — the row reads and
// writes live in lib/content-rows.ts.
//
// Adding a content type to the dashboard:
//   1. add a model to prisma/schema.prisma and `prisma db push`;
//   2. add an entry to CONTENT_SPECS below;
//   3. add a case in lib/content-rows.ts (list/get/upsert/delete);
//   4. add a NavLink in app/admin/(dashboard)/layout.tsx.
// The routes under app/admin/(dashboard)/content/[kind] serve every kind.

export type ContentKind = "services" | "experience" | "skills" | "uses";

export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  options?: { value: string; label: string }[];
  required?: boolean;
  max?: number;
  rows?: number;
  help?: string;
};

export type ContentSpec = {
  kind: ContentKind;
  /** Admin heading, e.g. "Services". */
  title: string;
  /** One row, e.g. "service" — used in button labels. */
  singular: string;
  /** Public paths to refresh after a change. */
  revalidate: string[];
  /** Field keys shown on the list row, in order. */
  preview: string[];
  fields: FieldSpec[];
};

export const CONTENT_SPECS: Record<ContentKind, ContentSpec> = {
  services: {
    kind: "services",
    title: "Services",
    singular: "service",
    revalidate: ["/services"],
    preview: ["title"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true, max: 200 },
      {
        key: "descriptionMD",
        label: "Description (markdown allowed)",
        type: "textarea",
        rows: 8,
        required: true,
      },
      {
        key: "priceNote",
        label: "Price note",
        type: "text",
        max: 200,
        help: "Small line under the title, e.g. a starting price. Optional.",
      },
      { key: "order", label: "Order", type: "number", required: true, help: "Lower numbers appear first." },
    ],
  },
  experience: {
    kind: "experience",
    title: "Experience",
    singular: "entry",
    revalidate: ["/about"],
    preview: ["title", "org"],
    fields: [
      {
        key: "kind",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "EDUCATION", label: "Education" },
          { value: "FREELANCE", label: "Freelance" },
          { value: "WORK", label: "Work" },
        ],
      },
      { key: "title", label: "Title", type: "text", required: true, max: 200 },
      { key: "org", label: "Organisation", type: "text", required: true, max: 200 },
      {
        key: "period",
        label: "Period",
        type: "text",
        required: true,
        max: 100,
        help: "Shown on the left of the timeline, e.g. 2021 - 2025.",
      },
      { key: "description", label: "Description", type: "textarea", rows: 4, required: true },
      { key: "order", label: "Order", type: "number", required: true, help: "Lower numbers appear first." },
    ],
  },
  skills: {
    kind: "skills",
    title: "Skills",
    singular: "skill",
    revalidate: ["/about"],
    preview: ["name", "group"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, max: 100 },
      {
        key: "group",
        label: "Group",
        type: "text",
        required: true,
        max: 100,
        help: "Skills with the same group render together, e.g. Frontend.",
      },
      { key: "order", label: "Order", type: "number", required: true, help: "Lower numbers appear first." },
    ],
  },
  uses: {
    kind: "uses",
    title: "Uses",
    singular: "item",
    revalidate: ["/uses"],
    preview: ["title", "group"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true, max: 200 },
      { key: "description", label: "Description", type: "textarea", rows: 3, required: true },
      {
        key: "group",
        label: "Group",
        type: "text",
        max: 100,
        help: "Leave empty to file the item under the page's fallback heading.",
      },
      { key: "order", label: "Order", type: "number", required: true, help: "Lower numbers appear first." },
    ],
  },
};

export const CONTENT_NAV: { kind: ContentKind; label: string }[] = [
  { kind: "services", label: "Services" },
  { kind: "experience", label: "Experience" },
  { kind: "skills", label: "Skills" },
  { kind: "uses", label: "Uses" },
];

// Looks a kind up from the URL. Unknown kinds fall through to notFound().
export function getSpec(kind: string): ContentSpec | null {
  return Object.prototype.hasOwnProperty.call(CONTENT_SPECS, kind)
    ? CONTENT_SPECS[kind as ContentKind]
    : null;
}
