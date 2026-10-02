// Seeds the starter Leads dropdown values. Safe to re-run: existing rows are never changed.
//   npx tsx scripts/leads-seed.ts          # write to the database in DATABASE_URL
//   npx tsx scripts/leads-seed.ts --sql    # print the equivalent SQL instead
import { PrismaClient } from "@prisma/client";
import { SEED_OPTIONS } from "../src/lib/leads/seed-data";

const q = (s: string | undefined) => (s === undefined ? "NULL" : `'${s.replace(/'/g, "''")}'`);

async function main() {
  if (process.argv.includes("--sql")) {
    const rows = SEED_OPTIONS.map((o, i) => `  (${q(o.id)}, ${q(o.type)}, ${q(o.key)}, ${q(o.label)}, ${q(o.parentId)}, ${i}, now(), now())`);
    console.log(`INSERT INTO "LeadOption" ("id", "type", "key", "label", "parentId", "sortOrder", "createdAt", "updatedAt") VALUES\n${rows.join(",\n")}\nON CONFLICT ("id") DO NOTHING;`);
    return;
  }
  const prisma = new PrismaClient();
  try {
    let created = 0;
    // Parents first (array order already guarantees this)
    for (const [i, o] of SEED_OPTIONS.entries()) {
      const exists = await prisma.leadOption.findUnique({ where: { id: o.id } });
      if (exists) continue;
      await prisma.leadOption.create({ data: { id: o.id, type: o.type, key: o.key ?? null, label: o.label, parentId: o.parentId ?? null, sortOrder: i } });
      created++;
    }
    console.log(`Lead options: ${created} created, ${SEED_OPTIONS.length - created} already present`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
