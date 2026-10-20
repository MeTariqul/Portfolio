// Restores a database from a backup taken by scripts/backup-db.mjs.
//
//   node scripts/restore-db.mjs backup.json --yes
//
// This REPLACES the contents of the tables in the backup. Tables that are in
// the database but not in the backup are left alone, so restoring a backup
// taken before a table existed will not drop that table.
//
// The --yes flag is required. Restoring over a live site is not something to
// do by accident, and the script prints what it is about to do first.
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const confirmed = args.includes("--yes");

  if (!file) {
    console.error("Usage: node scripts/restore-db.mjs <backup.json> --yes");
    process.exit(1);
  }

  const backup = JSON.parse(await readFile(file, "utf8"));
  const tables = Object.entries(backup.tables ?? {});
  if (tables.length === 0) {
    console.error("That file holds no tables.");
    process.exit(1);
  }

  const rowCount = tables.reduce((n, [, rows]) => n + rows.length, 0);
  console.log(`Backup taken at ${backup.takenAt}`);
  console.log(`${tables.length} tables, ${rowCount} rows`);
  console.log("");
  console.log("This replaces the rows in these tables:");
  for (const [name, rows] of tables) {
    console.log(`  ${name.padEnd(20)} ${rows.length} rows`);
  }
  console.log("");

  if (!confirmed) {
    console.log("Nothing was changed. Add --yes to go ahead.");
    return;
  }

  for (const [name, rows] of tables) {
    // The table name comes from the backup file. It is checked against the
    // tables that actually exist, and quoted as an identifier, so a tampered
    // backup cannot turn into a statement that does something else.
    const exists = await prisma.$queryRawUnsafe(
      `select 1 from information_schema.tables where table_schema = current_schema() and table_name = $1`,
      name,
    );
    if (!exists || exists.length === 0) {
      console.log(`  skipped ${name} (not in this database)`);
      continue;
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    if (columns.length === 0) {
      await prisma.$executeRawUnsafe(`truncate table "${name}"`);
      console.log(`  emptied ${name}`);
      continue;
    }

    const quoted = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const values = rows.map((row) =>
      columns.map((c) => {
        const v = row[c];
        return v instanceof Date ? v : v === null ? null : v;
      }),
    );

    await prisma.$transaction([
      prisma.$executeRawUnsafe(`truncate table "${name}"`),
      ...values.map(
        (v) =>
          prisma.$executeRawUnsafe(
            `insert into "${name}" (${quoted}) values (${placeholders})`,
            ...v,
          ),
      ),
    ]);
    console.log(`  restored ${name} (${rows.length} rows)`);
  }

  console.log("");
  console.log("Done. The sign-in sessions in the backup were restored too, so");
  console.log("any admin session that was open is open again.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("The restore failed:", err.message);
    await prisma.$disconnect();
    process.exit(1);
  });
