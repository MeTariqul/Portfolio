import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma used to read .env on its own. Once a config file exists it stops
// doing that, so the CLI commands (db:push, db:seed, studio) would lose
// DATABASE_URL locally while still working on Vercel, where the variables are
// already in the environment. loadEnvFile is the built-in replacement, and
// the existsSync guard keeps it quiet in CI and on the build server.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
