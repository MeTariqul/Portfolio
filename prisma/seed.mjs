// Seeds the database with the sample content in lib/sample-content.json.
// Idempotent: content tables are only filled when empty, so re-running the
// seed never overwrites edits you made in the admin panel.
//
//   npm run db:seed
//
// Admin login (used by /admin):
//   ADMIN_EMAIL / ADMIN_PASSWORD from .env, defaults below with a warning.
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sample = JSON.parse(
  readFileSync(new URL("../lib/sample-content.json", import.meta.url), "utf8"),
);

// Keep in sync with lib/password.ts
function hashPassword(password) {
  const N = 16384,
    r = 8,
    p = 1;
  const salt = randomBytes(16).toString("base64");
  const hash = scryptSync(password, salt, 64, { N, r, p }).toString("base64");
  return `scrypt$${N}$${r}$${p}$${salt}$${hash}`;
}

async function seedIfEmpty(label, model, rows) {
  const count = await prisma[model].count();
  if (count > 0) {
    console.log(`  ${label}: ${count} rows already present, skipped`);
    return;
  }
  for (const row of rows) await prisma[model].create({ data: row });
  console.log(`  ${label}: seeded ${rows.length} rows`);
}

async function seedSetting(key, value) {
  const existing = await prisma.setting.findUnique({ where: { key } });
  if (existing) {
    console.log(`  setting:${key}: already present, skipped`);
    return;
  }
  await prisma.setting.create({ data: { key, value } });
  console.log(`  setting:${key}: seeded`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "change-me-please";
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      "  ! ADMIN_EMAIL / ADMIN_PASSWORD not set in .env. Using defaults:",
      email,
      "/",
      password,
    );
    console.warn("  ! Set them in .env and re-seed after deleting the user row.");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  admin user: ${email} already present, skipped`);
    return;
  }
  await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), name: "Admin" },
  });
  console.log(`  admin user: ${email} created`);
}

async function main() {
  console.log("Seeding…");
  await seedAdmin();
  await seedIfEmpty("posts", "post", sample.posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    contentMD: p.contentMD,
    coverImage: p.coverImage,
    coverAlt: p.coverAlt,
    category: p.category,
    tags: p.tags,
    status: p.status,
    publishedAt: p.date ? new Date(p.date) : new Date(),
    featured: p.featured,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  })));
  await seedIfEmpty("projects", "project", sample.projects);
  await seedIfEmpty("skills", "skill", sample.skills);
  await seedIfEmpty("experience", "experience", sample.experience);
  await seedIfEmpty("services", "service", sample.services);
  await seedIfEmpty("uses", "usesItem", sample.uses);
  await seedSetting("availability", sample.settings.availability);
  await seedSetting("home", sample.settings.home);
  await seedSetting("about", sample.about);
  await seedSetting("newsletter", sample.settings.newsletter);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
