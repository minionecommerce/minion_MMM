// Importing items from a CSV file: the part that talks to the database. The Items page reads the file and runs the preview itself (item-import.ts); what it
// sends here is the rows to write, in parts. Every part is built and checked again here with the same functions, so nothing the browser sends is trusted.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { addFieldOption } from "@/lib/records/layout";
import { projectTemplates } from "@/lib/records/lookups";
import { PROJECT_TEMPLATE_FIELD } from "@/lib/records/registry";
import { needQuotes } from "./access";
import { loadSettings } from "./settings";
import { buildItem, mappingProblem, type DuplicateMode, type ExistingKey, type ItemData, type Mapping } from "./item-import";
import type { TaxDef } from "./types";

export const MAX_PART_ROWS = 500;

export type ImportContext = {
  taxes: TaxDef[];
  templates: { id: string; label: string }[];
  existing: ExistingKey[]; // every item of the Items module: enough to tell which rows of a file are there already
  canAddTemplates: boolean;
};

const need = (ctx: AuthContext) => { needQuotes(ctx, "create"); needQuotes(ctx, "edit"); };
const existingKeys = async (): Promise<ExistingKey[]> => prisma.catalogItem.findMany({ where: { deletedAt: null }, select: { id: true, externalId: true, name: true, sku: true } });

// What the Items page needs before it can preview a file
export async function loadImportContext(ctx: AuthContext): Promise<ImportContext> {
  need(ctx);
  const [settings, templates, existing] = await Promise.all([loadSettings(), projectTemplates(), existingKeys()]);
  return { taxes: settings.taxes, templates: templates.map(t => ({ id: t.id, label: t.label })), existing, canAddTemplates: ctx.isSuperAdmin };
}

// The Task Templates of the file that are not in the Project template list yet are added to it (Project → Edit Page Layout is where they are kept). A Super Admin only.
export async function addTaskTemplates(ctx: AuthContext, names: string[]): Promise<{ templates: { id: string; label: string }[]; added: string[]; failed: string[] }> {
  need(ctx);
  assertSuperAdmin(ctx);
  const added: string[] = [];
  const failed: string[] = [];
  let have = await projectTemplates();
  for (const raw of Array.from(new Set(names.map(n => n.trim()).filter(Boolean))).slice(0, 100)) {
    if (have.some(t => t.label.trim().toLowerCase() === raw.toLowerCase())) continue;
    try { await addFieldOption(ctx, "project", PROJECT_TEMPLATE_FIELD, raw); added.push(raw); have = await projectTemplates(); }
    catch (e) { failed.push(`${raw}${e instanceof ServiceError ? ` (${e.message})` : ""}`); }
  }
  return { templates: have.map(t => ({ id: t.id, label: t.label })), added, failed };
}

export type PartRow = { line: number; values: Record<string, string>; updateId?: string | null };
export type PartResult = { line: number; status: "created" | "updated" | "duplicate" | "invalid" | "failed"; name: string; reason: string; id?: string };

const nameSku = (name: string, sku: string | null) => `${name.trim().toLowerCase()}|${(sku ?? "").trim().toLowerCase()}`;

const createData = (d: ItemData, createdById: string): Prisma.CatalogItemCreateManyInput => ({
  name: d.name, description: d.description, hsn: d.hsn, unit: d.unit, unitGroup: null, rate: d.rate, taxId: d.taxId, interTaxId: d.interTaxId, kind: d.kind, isActive: d.isActive,
  category: d.category, sku: d.sku, taxPreference: d.taxPreference, identifiers: d.identifiers as unknown as Prisma.InputJsonValue,
  trackInventory: d.trackInventory, inventoryTracking: d.inventoryTracking, inventoryAccount: d.inventoryAccount, valuationMethod: d.valuationMethod, reorderPoint: d.reorderPoint,
  returnable: d.returnable, dimLength: d.dimLength, dimWidth: d.dimWidth, dimHeight: d.dimHeight, dimUnit: d.dimUnit, weight: d.weight, weightUnit: d.weightUnit, taskTemplateId: d.taskTemplateId,
  purchaseInfo: d.purchaseInfo, costPrice: d.costPrice, purchaseAccount: d.purchaseAccount, purchaseDescription: d.purchaseDescription, receivable: d.receivable,
  externalId: d.externalId, brand: d.brand, manufacturer: d.manufacturer, mrp: d.mrp, extra: d.extra ? (d.extra as Prisma.InputJsonValue) : undefined, createdById,
});

// An item that is there already is changed with what the file has to say; what the file leaves empty is left as it is
function updateData(d: ItemData): Prisma.CatalogItemUpdateInput {
  const patch: Record<string, unknown> = { ...createData(d, "") };
  delete patch.createdById;
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) delete patch[k];
  }
  return patch as Prisma.CatalogItemUpdateInput;
}

// One part of a file (up to MAX_PART_ROWS rows): the rows are built, the ones that cannot be imported or are there already are left out, the others are written.
// A row with an Item ID is the same item as the one with that Item ID; a row without one is the same as the item with its name and SKU.
export async function importPart(ctx: AuthContext, input: { rows: PartRow[]; mapping: Mapping; mode: DuplicateMode }): Promise<PartResult[]> {
  need(ctx);
  if (input.rows.length > MAX_PART_ROWS) throw new ServiceError(400, `Send ${MAX_PART_ROWS} rows at a time at most.`);
  const problem = mappingProblem(input.mapping);
  if (problem) throw new ServiceError(400, problem);

  const [settings, templates, existing] = await Promise.all([loadSettings(), projectTemplates(), existingKeys()]);
  const lookups = { taxes: settings.taxes, templates };
  const byExternal = new Map(existing.filter(e => e.externalId).map(e => [e.externalId as string, e]));
  const byNameSku = new Set(existing.map(e => nameSku(e.name, e.sku)));
  const byId = new Map(existing.map(e => [e.id, e]));

  const results = new Map<number, PartResult>();
  const queued: { line: number; data: ItemData }[] = [];
  const seenExternal = new Set<string>();
  const seenNameSku = new Set<string>();

  for (const row of input.rows) {
    const item = buildItem(row.values, input.mapping, lookups);
    const res = (status: PartResult["status"], reason = "", id?: string): PartResult => ({ line: row.line, status, name: item.name, reason, id });
    if (!item.data) { results.set(row.line, res("invalid", item.issues.find(i => i.level === "error")?.message ?? "Not valid.")); continue; }

    if (input.mode === "update" && row.updateId) {
      const target = byId.get(row.updateId);
      if (!target) { results.set(row.line, res("failed", "The item to update is not there any more.")); continue; }
      try {
        await prisma.catalogItem.update({ where: { id: target.id }, data: updateData(item.data) });
        results.set(row.line, res("updated", "", target.id));
      } catch (e) {
        results.set(row.line, res("failed", e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" ? "Another item already has this Item ID." : "It could not be updated."));
      }
      continue;
    }

    if (item.externalId) {
      if (byExternal.has(item.externalId)) { results.set(row.line, res("duplicate", "This Item ID is already in the Items module.", byExternal.get(item.externalId)!.id)); continue; }
      if (seenExternal.has(item.externalId)) { results.set(row.line, res("duplicate", "This Item ID is in this part twice.")); continue; }
      seenExternal.add(item.externalId);
    } else {
      const key = nameSku(item.name, item.sku);
      if (byNameSku.has(key)) { results.set(row.line, res("duplicate", "An item with the same name and SKU is already in the Items module.")); continue; }
      if (seenNameSku.has(key)) { results.set(row.line, res("duplicate", "The same name and SKU are in this part twice.")); continue; }
      seenNameSku.add(key);
    }
    queued.push({ line: row.line, data: item.data });
    results.set(row.line, res("created"));
  }

  if (queued.length) {
    try {
      await prisma.catalogItem.createMany({ data: queued.map(q => createData(q.data, ctx.userId)), skipDuplicates: true });
    } catch {
      for (const q of queued) results.set(q.line, { line: q.line, status: "failed", name: q.data.name, reason: "This part could not be written. Nothing of it was added." });
    }
    // an item that a parallel import added meanwhile is not written twice (the unique index on the Item ID says no): find out which rows really went in
    const ids = queued.map(q => q.data.externalId).filter((x): x is string => !!x);
    if (ids.length) {
      const now = new Set((await prisma.catalogItem.findMany({ where: { externalId: { in: ids }, deletedAt: null, createdById: ctx.userId }, select: { externalId: true } })).map(r => r.externalId as string));
      for (const q of queued) {
        const r = results.get(q.line);
        if (r?.status === "created" && q.data.externalId && !now.has(q.data.externalId)) results.set(q.line, { ...r, status: "duplicate", reason: "This Item ID was added by another import meanwhile." });
      }
    }
  }
  return input.rows.map(r => results.get(r.line)!);
}
