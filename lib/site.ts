// Identity and links. Static fallbacks only: the admin Settings screen
// overrides these at runtime from the `Setting` table.
//
// `url` is the absolute origin behind canonical links, Open Graph URLs and the
// RSS feed. Set NEXT_PUBLIC_SITE_URL in Vercel to pin it; otherwise the
// deployment's own URL is used, so production never publishes
// http://localhost:3000 (which it did, in every RSS link). A plain local build
// keeps the localhost default. Read defensively: this module is imported by
// client components too, where Vercel's variables do not exist.
const env = typeof process !== "undefined" ? process.env : undefined;
const deployed = env?.VERCEL_PROJECT_PRODUCTION_URL ?? env?.VERCEL_URL ?? null;

export const site = {
  name: "Md. Tariqul Islam",
  shortName: "Tariqul",
  role: "Web developer",
  location: "Savar, Dhaka, Bangladesh",
  education: "B.Sc. in CSE at Gono Bishwabidyalay",
  github: "https://github.com/MeTariqul",
  linkedin: "https://www.linkedin.com/in/metariqul",
  // Shown publicly on the home page, contact page and footer. Deliberately a
  // fixed address rather than CONTACT_EMAIL: that variable is the inbox
  // contact-form notifications go to (and the From address), and in
  // production it holds something you would not want printed on a public page.
  email: "tarif_me@outlook.com",
  url: env?.NEXT_PUBLIC_SITE_URL ?? (deployed ? `https://${deployed}` : "http://localhost:3000"),
  cvPath: "/cv/Md-Tariqul-Islam-CV.pdf",
};
