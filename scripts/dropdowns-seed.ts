// Seeds the starter values for the managed CRM / Project / Parks dropdowns. Safe to re-run: existing rows are never changed.
//   npx tsx scripts/dropdowns-seed.ts          # write to the database in DATABASE_URL
//   npx tsx scripts/dropdowns-seed.ts --sql    # print the equivalent SQL instead
import { PrismaClient } from "@prisma/client";
import { DROPDOWN_SEED_ROWS } from "../src/lib/dropdowns/seed-data";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

async function main() {
  if (process.argv.includes("--sql")) {
    const rows = DROPDOWN_SEED_ROWS.map(r => `  (${q(r.id)}, ${q(r.type)}, ${q(r.label)}, ${r.sortOrder}, ${r.isDefault}, now(), now())`);
    console.log(`INSERT INTO "LeadOption" ("id", "type", "label", "sortOrder", "isDefault", "createdAt", "updatedAt") VALUES\n${rows.join(",\n")}\nON CONFLICT ("id") DO NOTHING;`);
    return;
  }
  const prisma = new PrismaClient();
  try {
    let created = 0;
    for (const r of DROPDOWN_SEED_ROWS) {
      if (await prisma.leadOption.findUnique({ where: { id: r.id } })) continue;
      await prisma.leadOption.create({ data: r });
      created++;
    }
    console.log(`Dropdown options: ${created} created, ${DROPDOWN_SEED_ROWS.length - created} already present`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
