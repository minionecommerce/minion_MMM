// The items catalogue: what is picked on a quote (name, description, HSN/SAC, unit, rate, default tax). List, add, edit, switch off,
// delete, import from a CSV file (a Zoho Books item export works as it is) and export.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { isId, stripControl } from "@/lib/records/values";
import { needQuotes } from "./access";
import { csvLine, parseCsv } from "./csv";
import { loadSettings } from "./settings";
import type { ItemDto } from "./types";

const PAGE = 50;
const MAX_IMPORT_ROWS = 5000;
const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });
const asNumber = (d: { toNumber(): number } | number | null | undefined) => (d === null || d === undefined ? 0 : typeof d === "number" ? d : d.toNumber());

type ItemRow = Prisma.CatalogItemGetPayload<object>;
export const toItem = (r: ItemRow): ItemDto => ({
  id: r.id, name: r.name, description: r.description ?? "", hsn: r.hsn ?? "", unit: r.unit ?? "", rate: asNumber(r.rate), taxId: r.taxId,
  kind: r.kind === "Service" ? "Service" : "Goods", isActive: r.isActive, createdAt: r.createdAt.toISOString(),
});

// ---------------------------------------------------------------------------
// Checking what was typed
// ---------------------------------------------------------------------------
export type ItemInput = { name?: unknown; description?: unknown; hsn?: unknown; unit?: unknown; rate?: unknown; taxId?: unknown; kind?: unknown; isActive?: unknown };

const text = (v: unknown, max: number, what: string, required = false): string => {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") throw new ServiceError(400, `${what} must be text.`);
  const s = stripControl(v).replace(/[ \t]+/g, " ").trim();
  if (required && !s) throw new ServiceError(400, `${what} is required.`);
  if (s.length > max) throw new ServiceError(400, `${what} can be ${max} characters long at most.`);
  return s;
};

async function cleanItem(input: ItemInput, current?: ItemRow) {
  const settings = await loadSettings();
  const name = text(input.name ?? current?.name, 200, "The item name", true);
  const rateRaw = input.rate ?? (current ? asNumber(current.rate) : 0);
  const rate = typeof rateRaw === "number" ? rateRaw : typeof rateRaw === "string" && rateRaw.trim() !== "" ? Number(rateRaw) : NaN;
  if (!Number.isFinite(rate) || rate < 0 || rate > 99_999_999.99 || Math.round(rate * 100) / 100 !== rate) throw new ServiceError(400, "The rate must be an amount from 0 to 99,999,999.99 with two decimals at most.");
  const taxId: string | null = input.taxId === undefined ? current?.taxId ?? null : input.taxId === null || input.taxId === "" ? null : String(input.taxId);
  if (taxId && !settings.taxes.some(t => t.id === taxId && (t.active || t.id === current?.taxId))) throw new ServiceError(400, "Choose a tax from the list.");
  const kind = input.kind === undefined ? current?.kind ?? "Goods" : input.kind;
  if (kind !== "Goods" && kind !== "Service") throw new ServiceError(400, "The item is Goods or a Service.");
  const isActive = input.isActive === undefined ? current?.isActive ?? true : input.isActive;
  if (typeof isActive !== "boolean") throw new ServiceError(400, "Active must be Yes or No.");
  return {
    name,
    description: text(input.description ?? current?.description, 2000, "The description") || null,
    hsn: text(input.hsn ?? current?.hsn, 20, "The HSN/SAC") || null,
    unit: text(input.unit ?? current?.unit, 20, "The unit") || null,
    rate, taxId, kind, isActive,
  };
}

async function assertNameFree(name: string, exceptId?: string) {
  const clash = await prisma.catalogItem.findFirst({ where: { deletedAt: null, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  if (clash) throw new ServiceError(409, `An item called "${name}" already exists.`);
}

// ---------------------------------------------------------------------------
// List, add, edit, delete
// ---------------------------------------------------------------------------
export type ItemListParams = { q?: string; page: number; active?: "all" | "active" | "inactive" };

export async function listItems(ctx: AuthContext, p: ItemListParams) {
  needQuotes(ctx, "view");
  const where: Prisma.CatalogItemWhereInput = {
    deletedAt: null,
    ...(p.active === "active" ? { isActive: true } : p.active === "inactive" ? { isActive: false } : {}),
    ...(p.q ? { OR: [{ name: contains(p.q) }, { description: contains(p.q) }, { hsn: contains(p.q) }] } : {}),
  };
  const [total, showing, rows] = await Promise.all([
    prisma.catalogItem.count({ where: { deletedAt: null } }),
    prisma.catalogItem.count({ where }),
    prisma.catalogItem.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (p.page - 1) * PAGE, take: PAGE }),
  ]);
  return { rows: rows.map(toItem), total, showing, page: p.page, pageCount: Math.max(1, Math.ceil(showing / PAGE)), pageSize: PAGE };
}

export async function createItem(ctx: AuthContext, input: ItemInput): Promise<ItemDto> {
  needQuotes(ctx, "create");
  const data = await cleanItem(input);
  await assertNameFree(data.name);
  return toItem(await prisma.catalogItem.create({ data: { ...data, createdById: ctx.userId } }));
}

export async function updateItem(ctx: AuthContext, id: string, input: ItemInput): Promise<ItemDto> {
  needQuotes(ctx, "edit");
  if (!isId(id)) throw new ServiceError(404, "Item not found");
  const current = await prisma.catalogItem.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw new ServiceError(404, "Item not found");
  const data = await cleanItem(input, current);
  if (data.name.toLowerCase() !== current.name.toLowerCase()) await assertNameFree(data.name, id);
  return toItem(await prisma.catalogItem.update({ where: { id }, data }));
}

// Quotes keep their own copy of the name and the rate, so deleting an item never changes a quote
export async function deleteItem(ctx: AuthContext, id: string) {
  needQuotes(ctx, "delete");
  if (!isId(id)) throw new ServiceError(404, "Item not found");
  const current = await prisma.catalogItem.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true } });
  if (!current) throw new ServiceError(404, "Item not found");
  await prisma.catalogItem.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  return { deleted: true, name: current.name };
}

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
// header (normalised) -> what it holds; the first match wins
const HEADERS: Record<string, string[]> = {
  name: ["itemname", "name", "item", "productname"],
  description: ["description", "itemdescription", "salesdescription"],
  hsn: ["hsnsac", "hsn", "sac", "hsncode"],
  unit: ["usageunit", "unit", "uom"],
  rate: ["rate", "sellingprice", "salesrate", "price", "salesprice"],
  tax: ["intrastatetaxname", "taxname", "tax", "gst"],
  kind: ["producttype", "itemtype", "type"],
  status: ["status", "active"],
};

export type ImportResult = { created: number; updated: number; skipped: number; notes: string[] };

export async function importItems(ctx: AuthContext, csv: string): Promise<ImportResult> {
  needQuotes(ctx, "create");
  needQuotes(ctx, "edit");
  if (csv.length > 4_000_000) throw new ServiceError(400, "The file is larger than 4 MB.");
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new ServiceError(400, "The file has no items. The first line must be the column names.");
  if (rows.length - 1 > MAX_IMPORT_ROWS) throw new ServiceError(400, `The file has more than ${MAX_IMPORT_ROWS} items. Split it and import the parts one by one.`);
  const head = rows[0].map(norm);
  const at = (key: string) => head.findIndex(h => HEADERS[key].includes(h));
  const col = Object.fromEntries(Object.keys(HEADERS).map(k => [k, at(k)])) as Record<string, number>;
  if (col.name < 0) throw new ServiceError(400, 'The file needs an "Item Name" column.');

  const settings = await loadSettings();
  const taxByName = new Map(settings.taxes.map(t => [t.name.toLowerCase(), t.id]));
  const existing = new Map((await prisma.catalogItem.findMany({ where: { deletedAt: null }, select: { id: true, name: true } })).map(i => [i.name.toLowerCase(), i.id]));
  const out: ImportResult = { created: 0, updated: 0, skipped: 0, notes: [] };
  const note = (m: string) => { if (out.notes.length < 20) out.notes.push(m); };
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const cell = (k: string) => (col[k] >= 0 ? (r[col[k]] ?? "").trim() : "");
    const name = cell("name");
    if (!name) { out.skipped++; note(`Line ${i + 1}: no item name.`); continue; }
    if (seen.has(name.toLowerCase())) { out.skipped++; note(`Line ${i + 1}: "${name}" is in the file twice; the first one was used.`); continue; }
    seen.add(name.toLowerCase());
    const rateCell = cell("rate");
    const rateText = rateCell.replace(/[^0-9.\-]/g, "");
    const rate = rateText === "" ? 0 : Number(rateText);
    if ((rateCell !== "" && rateText === "") || !Number.isFinite(rate) || rate < 0 || rate > 99_999_999.99) { out.skipped++; note(`Line ${i + 1}: "${name}" has a rate that is not valid.`); continue; }
    const taxName = cell("tax");
    const taxId = taxName ? taxByName.get(taxName.toLowerCase()) ?? null : null;
    if (taxName && !taxId) note(`Line ${i + 1}: the tax "${taxName}" is not in Quote Settings, so "${name}" has no default tax.`);
    const kindText = cell("kind").toLowerCase();
    const status = cell("status").toLowerCase();
    try {
      const data = {
        name: text(name, 200, "The item name"),
        description: text(cell("description"), 2000, "The description") || null,
        hsn: text(cell("hsn"), 20, "The HSN/SAC") || null,
        unit: text(cell("unit"), 20, "The unit") || null,
        rate: Math.round(rate * 100) / 100,
        taxId,
        kind: kindText.startsWith("serv") ? "Service" : "Goods",
        isActive: status === "" ? true : !(status === "inactive" || status === "no" || status === "false"),
      };
      const id = existing.get(name.toLowerCase());
      if (id) { await prisma.catalogItem.update({ where: { id }, data }); out.updated++; }
      else { const row = await prisma.catalogItem.create({ data: { ...data, createdById: ctx.userId }, select: { id: true } }); existing.set(name.toLowerCase(), row.id); out.created++; }
    } catch (e) {
      out.skipped++;
      note(`Line ${i + 1}: "${name}" was not imported${e instanceof ServiceError ? ` (${e.message})` : ""}.`);
    }
  }
  return out;
}

export async function exportItems(ctx: AuthContext): Promise<string> {
  needQuotes(ctx, "export");
  const settings = await loadSettings();
  const tax = new Map(settings.taxes.map(t => [t.id, t.name]));
  const rows = await prisma.catalogItem.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, take: 20000 });
  const lines = [csvLine(["Item Name", "Description", "HSN/SAC", "Usage unit", "Rate", "Tax Name", "Product Type", "Status"])];
  for (const r of rows) lines.push(csvLine([r.name, r.description ?? "", r.hsn ?? "", r.unit ?? "", asNumber(r.rate).toFixed(2), r.taxId ? tax.get(r.taxId) ?? "" : "", r.kind === "Service" ? "service" : "goods", r.isActive ? "Active" : "Inactive"]));
  return "﻿" + lines.join("\r\n");
}
