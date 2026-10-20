// A logical backup of the whole database.
//
//   node scripts/backup-db.mjs [output-file]
//
// Writes every table to one JSON file: the table names, the rows, and the
// moment the backup was taken. It is a plain read of the tables, so it can
// run against production without stopping anything.
//
// Why it exists: the database has no other copy. A licence row, a ban, a
// key request — a row that disappears is gone, because the application does
// not keep a history of what it deleted. A backup is the only way back.
//
// Restore is a separate, deliberate act (see README), because restoring
// overwrites whatever is in the database now.
//
// The file is written to disk, not printed, because a backup printed to a
// terminal is a backup that gets lost with the scrollback.
import { writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const output =
    process.argv[2] ??
    `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

  const tables = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = current_schema()
      and table_type = 'BASE TABLE'
      and table_name not like 'pg_%'
    order by table_name
  `);

  const data = {};
  let totalRows = 0;

  for (const { table_name } of tables) {
    // The table name comes from the catalog, not from user input, and it is
    // quoted for the identifier; the values are bound parameters.
    const rows = await prisma.$queryRawUnsafe(
      `select * from "${table_name}"`,
    );
    data[table_name] = rows.map((row) => ({
      ...row,
      // Dates come back as Date objects, which JSON turns into strings. That
      // is fine for a backup, but they are put back as ISO strings so the
      // file is readable.
      ...Object.fromEntries(
        Object.entries(row)
          .filter(([, v]) => v instanceof Date)
          .map(([k, v]) => [k, v.toISOString()]),
      ),
    }));
    totalRows += rows.length;
    console.log(`  ${table_name.padEnd(20)} ${rows.length} rows`);
  }

  const payload = {
    takenAt: new Date().toISOString(),
    tables: data,
  };

  await writeFile(output, JSON.stringify(payload, null, 2), "utf8");
  console.log("");
  console.log(`${tables.length} tables, ${totalRows} rows -> ${output}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("The backup failed:", err.message);
    await prisma.$disconnect();
    process.exit(1);
  });
