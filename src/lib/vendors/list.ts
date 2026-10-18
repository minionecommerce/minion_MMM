import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { VENDOR_PAGE_SIZE, type VendorKindId, type VendorListData, type VendorListParams, type VendorRow } from "./params";

// Material and Service Vendors as one list: the two tables read side by side, one V1, V2 ... series. Each row keeps the id of its own
// table, so opening, editing and deleting a row goes to that vendor's own page and nothing about the vendor is copied.
const UNION = Prisma.sql`
  SELECT m.id, 'material'::text AS kind, m.code, m.seq, m."companyName" AS name, m.phone1 AS phone, m.city, m."vendorType" AS subtype, u.name AS person, m."createdAt"
    FROM "MaterialVendor" m LEFT JOIN "User" u ON u.id = m."taskPersonId" WHERE m."deletedAt" IS NULL
  UNION ALL
  SELECT s.id, 'service'::text, s.code, s.seq, s.name, s.phone1, s.city, s."vendorType", u.name, s."createdAt"
    FROM "ServiceVendor" s LEFT JOIN "User" u ON u.id = s."taskPersonId" WHERE s."deletedAt" IS NULL`;

const likeOf = (q: string) => `%${q.replace(/[\\%_]/g, c => `\\${c}`)}%`;

function whereOf(p: VendorListParams) {
  const parts: Prisma.Sql[] = [];
  if (p.types.length) parts.push(Prisma.sql`kind IN (${Prisma.join(p.types)})`);
  if (p.q) {
    const like = likeOf(p.q);
    parts.push(Prisma.sql`(code ILIKE ${like} OR name ILIKE ${like} OR phone ILIKE ${like} OR city ILIKE ${like} OR subtype ILIKE ${like} OR person ILIKE ${like} OR kind ILIKE ${like})`);
  }
  return parts.length ? Prisma.sql`WHERE ${Prisma.join(parts, " AND ")}` : Prisma.empty;
}

function orderOf(p: VendorListParams) {
  const d = p.dir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const tie = Prisma.sql`seq DESC`;
  switch (p.sort) {
    case "type": return Prisma.sql`ORDER BY kind ${d}, ${tie}`;
    case "name": return Prisma.sql`ORDER BY lower(name) ${d}, ${tie}`;
    case "city": return Prisma.sql`ORDER BY lower(city) ${d} NULLS LAST, ${tie}`;
    case "created": return Prisma.sql`ORDER BY "createdAt" ${d}, ${tie}`;
    default: return Prisma.sql`ORDER BY seq ${d}`; // the V numbers are given out in the order vendors are made
  }
}

type Raw = { id: string; kind: VendorKindId; code: string; name: string; phone: string | null; city: string | null; subtype: string | null; person: string | null; createdAt: Date };
const toRow = (r: Raw): VendorRow => ({ id: r.id, kind: r.kind, code: r.code, name: r.name, phone: r.phone, city: r.city, subtype: r.subtype, person: r.person, created: r.createdAt.toISOString() });

export async function listVendors(p: VendorListParams): Promise<VendorListData> {
  const where = whereOf(p);
  const [rows, counts, totals] = await Promise.all([
    prisma.$queryRaw<Raw[]>`SELECT * FROM (${UNION}) v ${where} ${orderOf(p)} LIMIT ${VENDOR_PAGE_SIZE} OFFSET ${(p.page - 1) * VENDOR_PAGE_SIZE}`,
    prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM (${UNION}) v ${where}`,
    prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM (${UNION}) v`,
  ]);
  const showing = Number(counts[0]?.n ?? 0);
  return { rows: rows.map(toRow), total: Number(totals[0]?.n ?? 0), showing, page: p.page, pageCount: Math.max(1, Math.ceil(showing / VENDOR_PAGE_SIZE)), pageSize: VENDOR_PAGE_SIZE };
}

const csvCell = (value: unknown) => {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // spreadsheets run text that starts with = + - @ as a formula
  return `"${s.replace(/"/g, '""')}"`;
};

export async function vendorsCsv(p: VendorListParams) {
  const rows = (await prisma.$queryRaw<Raw[]>`SELECT * FROM (${UNION}) v ${whereOf(p)} ${orderOf(p)} LIMIT 10000`).map(toRow);
  const lines = [["Vendor ID", "Vendor Type", "Name", "Phone", "City", "Business Type", "Task Person"].map(csvCell).join(",")];
  for (const r of rows) lines.push([r.code, r.kind === "material" ? "Material" : "Service", r.name, r.phone, r.city, r.subtype, r.person].map(csvCell).join(","));
  return "﻿" + lines.join("\r\n");
}
