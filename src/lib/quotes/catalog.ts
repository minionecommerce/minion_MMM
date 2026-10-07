// The items catalogue (the Item Master): what is picked on a quote. List, add (the New Item form), edit, switch off, delete, the pictures of an item,
// the pick-lists of the form (categories, units, accounts), import from a CSV file (a Zoho Books item export works as it is) and export.
// The HSN code / SAC is typed in as plain numbers (2 to 8 digits); the form suggests one from the item name (see ./hsn-sac).

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { isId, stripControl } from "@/lib/records/values";
import { bindFiles, filesOf, type FileSlot } from "@/lib/records/files";
import { projectTemplates } from "@/lib/records/lookups";
import type { FileDto, LookupItem } from "@/lib/records/types";
import { createReadUrls, removeObjects } from "@/lib/leads/storage";
import { needQuoteWriter, needQuotes } from "./access";
import { csvLine } from "./csv";
import { loadSettings } from "./settings";
import {
  COMMON_UNITS, DEFAULT_DIM_UNIT, DEFAULT_TAX_PREFERENCE, DEFAULT_VALUATION, DEFAULT_WEIGHT_UNIT, DIM_UNITS, IDENTIFIER_TYPES, INVENTORY_ACCOUNTS, INVENTORY_TRACKING, PURCHASE_ACCOUNTS,
  ITEM_IMAGE_FIELDS, ITEM_IMAGE_KEYS, MAX_DIMENSION, MAX_IDENTIFIERS, MAX_ITEM_IMAGES, MAX_OTHER_IMAGES, TAX_PREFERENCES, VALUATION_METHODS, WEIGHT_UNITS,
  hasFulfilment, hasInventory, isItemKind, isTaxCode, isTaxable, taxCodeField, unitGroupOf, type Identifier, type ItemKind,
} from "./item-constants";
import type { ItemDetailDto, ItemDto, ItemImages } from "./types";

const PAGE = 50;
const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });
const asNumber = (d: { toNumber(): number } | number | null | undefined) => (d === null || d === undefined ? 0 : typeof d === "number" ? d : d.toNumber());
const asNumberOrNull = (d: { toNumber(): number } | number | null | undefined) => (d === null || d === undefined ? null : asNumber(d));
const TX = { maxWait: 10_000, timeout: 20_000 };

type ItemRow = Prisma.CatalogItemGetPayload<object>;

// ---------------------------------------------------------------------------
// What a row is shown as
// ---------------------------------------------------------------------------
// The names of the task templates and the picture of each item, for a list of rows (two small reads, however many rows there are)
export type ItemExtras = { templates: Map<string, string>; images: Map<string, string> };

export async function loadItemExtras(itemIds: string[]): Promise<ItemExtras> {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  const [templates, files] = await Promise.all([
    projectTemplates(),
    ids.length
      ? prisma.moduleFile.findMany({
          where: { module: "item", recordId: { in: ids }, fieldKey: { in: ITEM_IMAGE_KEYS }, status: "READY", deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, recordId: true, fieldKey: true },
        })
      : Promise.resolve([]),
  ]);
  // the picture on a quote row: the front picture, else the first of the other pictures, else the rear one
  const rank: Record<string, number> = { [ITEM_IMAGE_FIELDS.front]: 0, [ITEM_IMAGE_FIELDS.other]: 1, [ITEM_IMAGE_FIELDS.rear]: 2 };
  const best = new Map<string, number>();
  const images = new Map<string, string>();
  for (const f of files) {
    if (!f.recordId) continue;
    const r = rank[f.fieldKey] ?? 9;
    if (!best.has(f.recordId) || r < best.get(f.recordId)!) { best.set(f.recordId, r); images.set(f.recordId, f.id); }
  }
  return { templates: new Map(templates.map(o => [o.id, o.label])), images };
}

export const toItem = (r: ItemRow, x?: ItemExtras): ItemDto => ({
  id: r.id, name: r.name, description: r.description ?? "", hsn: r.hsn ?? "", unit: r.unit ?? "", rate: asNumber(r.rate), taxId: r.taxId, interTaxId: r.interTaxId,
  kind: r.kind === "Service" ? "Service" : "Goods", isActive: r.isActive, createdAt: r.createdAt.toISOString(),
  category: r.category ?? "", sku: r.sku ?? "", taxPreference: r.taxPreference || DEFAULT_TAX_PREFERENCE,
  taskTemplateId: r.taskTemplateId, taskTemplateName: r.taskTemplateId ? x?.templates.get(r.taskTemplateId) ?? "" : "", imageFileId: x?.images.get(r.id) ?? null,
});

const toIdentifiers = (v: Prisma.JsonValue | null): Identifier[] =>
  Array.isArray(v) ? v.flatMap(x => (x && typeof x === "object" && !Array.isArray(x) && typeof x.type === "string" && typeof x.value === "string" ? [{ type: x.type, value: x.value }] : [])) : [];

const toExtra = (v: Prisma.JsonValue | null): Record<string, string> =>
  v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).flatMap(([k, x]) => (typeof x === "string" ? [[k, x]] : []))) : {};

function toDetail(r: ItemRow, x: ItemExtras, images: ItemImages): ItemDetailDto {
  return {
    ...toItem(r, x),
    unitGroup: r.unitGroup, identifiers: toIdentifiers(r.identifiers), trackInventory: r.trackInventory, inventoryTracking: r.inventoryTracking, inventoryAccount: r.inventoryAccount ?? "",
    valuationMethod: r.valuationMethod, reorderPoint: asNumberOrNull(r.reorderPoint), returnable: r.returnable,
    brand: r.brand ?? "", manufacturer: r.manufacturer ?? "", mrp: asNumberOrNull(r.mrp), externalId: r.externalId, extra: toExtra(r.extra),
    purchaseInfo: r.purchaseInfo, costPrice: asNumberOrNull(r.costPrice), purchaseAccount: r.purchaseAccount ?? "", purchaseDescription: r.purchaseDescription ?? "", receivable: r.receivable,
    dimLength: asNumberOrNull(r.dimLength), dimWidth: asNumberOrNull(r.dimWidth), dimHeight: asNumberOrNull(r.dimHeight), dimUnit: r.dimUnit || DEFAULT_DIM_UNIT,
    weight: asNumberOrNull(r.weight), weightUnit: r.weightUnit || DEFAULT_WEIGHT_UNIT, images,
  };
}
async function detailOf(row: ItemRow): Promise<ItemDetailDto> {
  const [x, files] = await Promise.all([loadItemExtras([row.id]), filesOf("item", row.id)]);
  const of = (key: string): FileDto[] => files.get(`|${key}`) ?? [];
  return toDetail(row, x, { front: of(ITEM_IMAGE_FIELDS.front), rear: of(ITEM_IMAGE_FIELDS.rear), other: of(ITEM_IMAGE_FIELDS.other) });
}

// ---------------------------------------------------------------------------
// Checking what was typed
// ---------------------------------------------------------------------------
export type ItemInput = {
  name?: unknown; description?: unknown; hsn?: unknown; unit?: unknown; unitGroup?: unknown; rate?: unknown; taxId?: unknown; kind?: unknown; isActive?: unknown;
  category?: unknown; sku?: unknown; taxPreference?: unknown; identifiers?: unknown; trackInventory?: unknown; inventoryTracking?: unknown; inventoryAccount?: unknown;
  valuationMethod?: unknown; reorderPoint?: unknown; returnable?: unknown; dimLength?: unknown; dimWidth?: unknown; dimHeight?: unknown; dimUnit?: unknown;
  weight?: unknown; weightUnit?: unknown; taskTemplateId?: unknown; files?: unknown;
  purchaseInfo?: unknown; costPrice?: unknown; purchaseAccount?: unknown; purchaseDescription?: unknown; receivable?: unknown; interTaxId?: unknown;
  brand?: unknown; manufacturer?: unknown; mrp?: unknown;
};

const bad = (message: string): never => { throw new ServiceError(400, message); };

const text = (v: unknown, max: number, what: string, required = false): string => {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") return bad(`${what} must be text.`);
  const s = stripControl(v).replace(/[ \t]+/g, " ").trim();
  if (required && !s) return bad(`${what} is required.`);
  if (s.length > max) return bad(`${what} can be ${max} characters long at most.`);
  return s;
};

const flag = (v: unknown, what: string, fallback: boolean): boolean => {
  if (v === undefined) return fallback;
  if (typeof v !== "boolean") return bad(`${what} must be Yes or No.`);
  return v;
};

// A number typed or sent: from 0 to `max`, with `places` decimals at most. Nothing typed is `null` (or an error when it is required).
function decimal(v: unknown, what: string, max: number, places: number, required = false): number | null {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    if (required) return bad(`${what} is required.`);
    return null;
  }
  const n = typeof v === "number" ? v : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v.trim()) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > max || Math.round(n * 10 ** places) / 10 ** places !== n) {
    return bad(`${what} must be ${places === 2 ? "an amount" : "a number"} from 0 to ${max.toLocaleString("en-IN")} with ${places === 2 ? "two" : places === 3 ? "three" : places} decimals at most.`);
  }
  return n;
}

function cleanIdentifiers(v: unknown): Identifier[] {
  if (v === null) return [];
  if (!Array.isArray(v)) return bad("The identifiers are not valid.");
  const out: Identifier[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object" || Array.isArray(x)) return bad("An identifier is not valid.");
    const type = text((x as Record<string, unknown>).type, 30, "The identifier type", true);
    const value = text((x as Record<string, unknown>).value, 100, "The identifier");
    if (!IDENTIFIER_TYPES.includes(type)) return bad(`"${type}" is not an identifier type you can choose.`);
    if (value) out.push({ type, value }); // a row with nothing typed is left out
  }
  if (out.length > MAX_IDENTIFIERS) return bad(`An item can have ${MAX_IDENTIFIERS} identifiers at most.`);
  return out;
}

// The pictures: { front: [id], rear: [id], other: [id ...] }. Not sent = the pictures stay as they are.
function cleanFiles(raw: unknown): FileSlot[] | null {
  if (raw === undefined) return null;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return bad("The pictures are not valid.");
  const f = raw as Record<string, unknown>;
  const list = (key: string, max: number, what: string): string[] => {
    const v = f[key];
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v) || !v.every(isId)) return bad(`${what} has a picture that cannot be used.`);
    if (v.length > max) return bad(`${what} can have ${max} picture${max === 1 ? "" : "s"} at most.`);
    return v;
  };
  const front = list("front", 1, "Front View");
  const rear = list("rear", 1, "Rear View");
  const other = list("other", MAX_OTHER_IMAGES, "Other Images");
  if (front.length + rear.length + other.length > MAX_ITEM_IMAGES) return bad(`An item can have ${MAX_ITEM_IMAGES} pictures at most.`);
  return [
    { fieldKey: ITEM_IMAGE_FIELDS.front, rowId: null, ids: front },
    { fieldKey: ITEM_IMAGE_FIELDS.rear, rowId: null, ids: rear },
    { fieldKey: ITEM_IMAGE_FIELDS.other, rowId: null, ids: other },
  ];
}

// Worked on whatever the form sent: a Service has no stock, nothing to return and nothing to ship, so those values are never kept for one.
export async function cleanItem(input: ItemInput, current?: ItemRow) {
  const settings = await loadSettings();
  const given = (k: keyof ItemInput) => input[k] !== undefined;

  const name = text(input.name ?? current?.name, 200, "The item name", true);
  const kindRaw = input.kind === undefined ? current?.kind ?? "Goods" : input.kind;
  if (!isItemKind(kindRaw)) return bad("The item is Goods or a Service.");
  const kind: ItemKind = kindRaw;

  // the HSN code of Goods / the SAC of a Service: asked for when the item is new or when the form sends it
  const hsn = text(input.hsn === undefined ? current?.hsn : input.hsn, 20, `The ${taxCodeField(kind)}`);
  if (!current || given("hsn") || given("kind")) {
    if (!hsn) return bad(`The ${taxCodeField(kind)} is required.`);
  }
  if (hsn && !isTaxCode(hsn)) return bad(`The ${taxCodeField(kind)} must be 2 to 8 digits.`);

  const rate = decimal(input.rate === undefined ? (current ? asNumber(current.rate) : undefined) : input.rate, "The selling price", 99_999_999.99, 2, !current || given("rate"));
  if (rate === null) return bad("The selling price is required.");

  const taxPreference = input.taxPreference === undefined ? current?.taxPreference ?? DEFAULT_TAX_PREFERENCE : input.taxPreference;
  if (typeof taxPreference !== "string" || !TAX_PREFERENCES.some(t => t.id === taxPreference)) return bad("Choose a Tax Preference from the list.");
  let taxId: string | null = input.taxId === undefined ? current?.taxId ?? null : input.taxId === null || input.taxId === "" ? null : String(input.taxId);
  if (!isTaxable(taxPreference)) taxId = null; // an item that is not taxable has no default tax
  if (taxId && !settings.taxes.some(t => t.id === taxId && (t.active || t.id === current?.taxId))) return bad("Choose an Intra State Tax Rate from the list.");
  // the Inter State Tax Rate: the tax a quote row starts with when the quote is for another state
  let interTaxId: string | null = input.interTaxId === undefined ? current?.interTaxId ?? null : input.interTaxId === null || input.interTaxId === "" ? null : String(input.interTaxId);
  if (!isTaxable(taxPreference)) interTaxId = null;
  if (interTaxId && !settings.taxes.some(t => t.id === interTaxId && (t.active || t.id === current?.interTaxId))) return bad("Choose an Inter State Tax Rate from the list.");

  // the task template: one of the project templates (Project → Edit Page Layout)
  const templates = await projectTemplates();
  const tplRaw = input.taskTemplateId;
  if (tplRaw !== undefined && tplRaw !== null && tplRaw !== "" && typeof tplRaw !== "string") return bad("Choose a Task Template from the list.");
  let taskTemplateId: string | null = tplRaw === undefined ? current?.taskTemplateId ?? null : tplRaw ? tplRaw : null;
  if (taskTemplateId && !templates.some(o => o.id === taskTemplateId)) {
    if (taskTemplateId !== current?.taskTemplateId) return bad("Choose a Task Template from the list.");
    taskTemplateId = null; // the template this item had was deleted meanwhile
  }
  if (!taskTemplateId && (!current || tplRaw !== undefined)) return bad("The Task Template is required.");

  const category = text(input.category === undefined ? current?.category : input.category, 100, "The category") || null;
  const sku = text(input.sku === undefined ? current?.sku : input.sku, 100, "The SKU") || null;
  const description = text(input.description === undefined ? current?.description : input.description, 2000, "The description") || null;
  const isActive = flag(input.isActive, "Active", current?.isActive ?? true);

  // unit, or a group of units (choosing a group sets its first unit)
  const unitGroupRaw = input.unitGroup === undefined ? current?.unitGroup ?? null : input.unitGroup === "" ? null : input.unitGroup;
  if (unitGroupRaw !== null && typeof unitGroupRaw !== "string") return bad("Choose a unit group from the list.");
  const group = unitGroupRaw === null ? null : unitGroupOf(unitGroupRaw);
  if (unitGroupRaw !== null && !group) return bad("Choose a unit group from the list.");
  let unit = text(input.unit === undefined ? current?.unit : input.unit, 20, "The unit") || null;
  if (group && unit && !group.units.includes(unit)) return bad(`"${unit}" is not a unit of the ${group.label} group.`);
  if (group && !unit) unit = group.units[0]; // choosing a group sets its first unit
  // the unit is shown under the quantity and the rate of a quote row: asked for when the item is new or when the form sends it (an import and a partial
  // update that leaves it alone are exempt, as for the other rules)
  if (!unit && (!current || given("unit") || given("unitGroup"))) return bad("The unit is required.");

  const identifiers = input.identifiers === undefined ? toIdentifiers(current?.identifiers ?? null) : cleanIdentifiers(input.identifiers);

  // Goods only: stock, returns, size and weight
  let trackInventory = false;
  let inventoryTracking = "none";
  let inventoryAccount: string | null = null;
  let valuationMethod = DEFAULT_VALUATION;
  let reorderPoint: number | null = null;
  let returnable = false; // a new item is not returnable unless it is said to be
  let dimLength: number | null = null; let dimWidth: number | null = null; let dimHeight: number | null = null;
  let dimUnit = DEFAULT_DIM_UNIT; let weight: number | null = null; let weightUnit = DEFAULT_WEIGHT_UNIT;
  if (hasInventory(kind)) {
    trackInventory = flag(input.trackInventory, "Track Inventory", current?.trackInventory ?? false);
    if (trackInventory) {
      const tracking = input.inventoryTracking === undefined ? current?.inventoryTracking ?? "none" : input.inventoryTracking;
      if (typeof tracking !== "string" || !INVENTORY_TRACKING.some(t => t.id === tracking)) return bad("Choose how the inventory is tracked: None or Batch.");
      inventoryTracking = tracking;
      inventoryAccount = text(input.inventoryAccount === undefined ? current?.inventoryAccount : input.inventoryAccount, 100, "The Inventory Account") || null;
      if (!inventoryAccount) return bad("The Inventory Account is required.");
      const method = input.valuationMethod === undefined ? current?.valuationMethod ?? DEFAULT_VALUATION : input.valuationMethod;
      if (typeof method !== "string" || !VALUATION_METHODS.some(m => m.id === method)) return bad("Choose an Inventory Valuation Method from the list.");
      valuationMethod = method;
      reorderPoint = decimal(input.reorderPoint === undefined ? (current ? asNumberOrNull(current.reorderPoint) : null) : input.reorderPoint, "The Reorder Point", 99_999_999_999.99, 2);
    }
    returnable = flag(input.returnable, "Returnable Item", current?.returnable ?? false);
  }
  if (hasFulfilment(kind)) {
    const pick = (k: "dimLength" | "dimWidth" | "dimHeight" | "weight", what: string) =>
      decimal(input[k] === undefined ? (current ? asNumberOrNull(current[k]) : null) : input[k], what, MAX_DIMENSION, 3);
    dimLength = pick("dimLength", "The length"); dimWidth = pick("dimWidth", "The width"); dimHeight = pick("dimHeight", "The height"); weight = pick("weight", "The weight");
    const du = input.dimUnit === undefined ? current?.dimUnit ?? DEFAULT_DIM_UNIT : input.dimUnit;
    if (typeof du !== "string" || !DIM_UNITS.includes(du)) return bad("Choose a unit for the dimensions from the list.");
    dimUnit = du;
    const wu = input.weightUnit === undefined ? current?.weightUnit ?? DEFAULT_WEIGHT_UNIT : input.weightUnit;
    if (typeof wu !== "string" || !WEIGHT_UNITS.includes(wu)) return bad("Choose a unit for the weight from the list.");
    weightUnit = wu;
  }

  const brand = text(input.brand === undefined ? current?.brand : input.brand, 100, "The brand") || null;
  const manufacturer = text(input.manufacturer === undefined ? current?.manufacturer : input.manufacturer, 100, "The manufacturer") || null;
  const mrp = decimal(input.mrp === undefined ? (current ? asNumberOrNull(current.mrp) : null) : input.mrp, "The MRP", 99_999_999.99, 2);

  // Purchase Information: what is typed under it is kept only while it is ticked
  const purchaseInfo = flag(input.purchaseInfo, "Purchase Information", current?.purchaseInfo ?? false);
  let costPrice: number | null = null;
  let purchaseAccount: string | null = null;
  let purchaseDescription: string | null = null;
  let receivable = false;
  if (purchaseInfo) {
    costPrice = decimal(input.costPrice === undefined ? (current?.purchaseInfo ? asNumberOrNull(current.costPrice) : undefined) : input.costPrice, "The cost price", 99_999_999.99, 2, true);
    purchaseAccount = text(input.purchaseAccount === undefined ? current?.purchaseAccount : input.purchaseAccount, 100, "The Purchase Account") || null;
    if (!purchaseAccount) return bad("The Purchase Account is required.");
    purchaseDescription = text(input.purchaseDescription === undefined ? current?.purchaseDescription : input.purchaseDescription, 2000, "The purchase description") || null;
    receivable = flag(input.receivable, "Receivable Item", current?.receivable ?? false);
  }

  return {
    data: {
      name, description, hsn: hsn || null, unit, unitGroup: group ? group.id : null, rate, taxId, kind, isActive,
      category, taxPreference, sku, identifiers: identifiers as unknown as Prisma.InputJsonValue, trackInventory, inventoryTracking, inventoryAccount, valuationMethod,
      reorderPoint, returnable, dimLength, dimWidth, dimHeight, dimUnit, weight, weightUnit, taskTemplateId,
      interTaxId, purchaseInfo, costPrice, purchaseAccount, purchaseDescription, receivable, brand, manufacturer, mrp,
    },
    slots: cleanFiles(input.files),
  };
}

async function assertNameFree(name: string, exceptId?: string) {
  const clash = await prisma.catalogItem.findFirst({ where: { deletedAt: null, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  if (clash) throw new ServiceError(409, `An item called "${name}" already exists.`);
}

async function assertSkuFree(sku: string | null, exceptId?: string) {
  if (!sku) return;
  const clash = await prisma.catalogItem.findFirst({ where: { deletedAt: null, sku: { equals: sku, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { name: true } });
  if (clash) throw new ServiceError(409, `The SKU "${sku}" is already used by "${clash.name}".`);
}

// ---------------------------------------------------------------------------
// List, add, edit, delete
// ---------------------------------------------------------------------------
export const ITEM_SORTS = ["name", "rate", "hsn", "unit", "kind", "category", "status", "created"] as const;
export type ItemSort = (typeof ITEM_SORTS)[number];
export type ItemListParams = { q?: string; page: number; active?: "all" | "active" | "inactive"; kind?: ItemKind; sort?: ItemSort; dir?: "asc" | "desc" };

// What the search box looks in: the name, the description, the HSN/SAC, the SKU, the category, the brand, the manufacturer and the Item ID
export const itemSearch = (q: string): Prisma.CatalogItemWhereInput => ({
  OR: [{ name: contains(q) }, { description: contains(q) }, { hsn: contains(q) }, { sku: contains(q) }, { category: contains(q) }, { brand: contains(q) }, { manufacturer: contains(q) }, { externalId: contains(q) }],
});

const orderOf = (sort: ItemSort | undefined, dir: "asc" | "desc"): Prisma.CatalogItemOrderByWithRelationInput[] => {
  const then: Prisma.CatalogItemOrderByWithRelationInput[] = [{ name: "asc" }, { id: "asc" }];
  const nulls = (field: "hsn" | "unit" | "category") => ({ [field]: { sort: dir, nulls: "last" } }) as Prisma.CatalogItemOrderByWithRelationInput;
  switch (sort) {
    case "rate": return [{ rate: dir }, ...then];
    case "hsn": return [nulls("hsn"), ...then];
    case "unit": return [nulls("unit"), ...then];
    case "category": return [nulls("category"), ...then];
    case "kind": return [{ kind: dir }, ...then];
    case "status": return [{ isActive: dir === "asc" ? "desc" : "asc" }, ...then]; // ascending: active first
    case "created": return [{ createdAt: dir }, { id: dir }];
    default: return [{ name: dir }, { id: dir }];
  }
};

export async function listItems(ctx: AuthContext, p: ItemListParams) {
  needQuotes(ctx, "view");
  const where: Prisma.CatalogItemWhereInput = {
    deletedAt: null,
    ...(p.active === "active" ? { isActive: true } : p.active === "inactive" ? { isActive: false } : {}),
    ...(p.kind ? { kind: p.kind } : {}),
    ...(p.q ? itemSearch(p.q) : {}),
  };
  const [total, showing, rows] = await Promise.all([
    prisma.catalogItem.count({ where: { deletedAt: null } }),
    prisma.catalogItem.count({ where }),
    prisma.catalogItem.findMany({ where, orderBy: orderOf(p.sort, p.dir ?? "asc"), skip: (p.page - 1) * PAGE, take: PAGE }),
  ]);
  const x = await loadItemExtras(rows.map(r => r.id));
  return { rows: rows.map(r => toItem(r, x)), total, showing, page: p.page, pageCount: Math.max(1, Math.ceil(showing / PAGE)), pageSize: PAGE };
}

// One item with everything the New Item form shows, pictures included
export async function getItemDetail(ctx: AuthContext, id: string): Promise<ItemDetailDto> {
  needQuotes(ctx, "view");
  if (!isId(id)) throw new ServiceError(404, "Item not found");
  const row = await prisma.catalogItem.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new ServiceError(404, "Item not found");
  return detailOf(row);
}

export async function createItem(ctx: AuthContext, input: ItemInput): Promise<ItemDetailDto> {
  needQuotes(ctx, "create");
  const { data, slots } = await cleanItem(input);
  await assertNameFree(data.name);
  await assertSkuFree(data.sku);
  const removed: string[] = [];
  const row = await prisma.$transaction(async tx => {
    const created = await tx.catalogItem.create({ data: { ...data, createdById: ctx.userId } });
    if (slots) removed.push(...(await bindFiles(tx, ctx, "item", created.id, slots, [])));
    return created;
  }, TX);
  await removeObjects(removed);
  return detailOf(row);
}

export async function updateItem(ctx: AuthContext, id: string, input: ItemInput): Promise<ItemDetailDto> {
  needQuotes(ctx, "edit");
  if (!isId(id)) throw new ServiceError(404, "Item not found");
  const current = await prisma.catalogItem.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw new ServiceError(404, "Item not found");
  const { data, slots } = await cleanItem(input, current);
  if (data.name.toLowerCase() !== current.name.toLowerCase()) await assertNameFree(data.name, id);
  if ((data.sku ?? "").toLowerCase() !== (current.sku ?? "").toLowerCase()) await assertSkuFree(data.sku, id);
  const removed: string[] = [];
  const row = await prisma.$transaction(async tx => {
    const updated = await tx.catalogItem.update({ where: { id }, data });
    if (slots) removed.push(...(await bindFiles(tx, ctx, "item", id, slots, [])));
    return updated;
  }, TX);
  await removeObjects(removed);
  return detailOf(row);
}

// Quotes keep their own copy of the name and the rate, so deleting an item never changes a quote
export async function deleteItem(ctx: AuthContext, id: string) {
  needQuotes(ctx, "delete");
  if (!isId(id)) throw new ServiceError(404, "Item not found");
  const current = await prisma.catalogItem.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true } });
  if (!current) throw new ServiceError(404, "Item not found");
  const pictures = await prisma.moduleFile.findMany({ where: { module: "item", recordId: id, deletedAt: null }, select: { id: true, storagePath: true } });
  await prisma.$transaction(async tx => {
    await tx.catalogItem.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    if (pictures.length) await tx.moduleFile.updateMany({ where: { id: { in: pictures.map(p => p.id) } }, data: { deletedAt: new Date() } });
  }, TX);
  await removeObjects(pictures.map(p => p.storagePath));
  return { deleted: true, name: current.name };
}

// ---------------------------------------------------------------------------
// The pictures
// ---------------------------------------------------------------------------
// A short-lived link to one picture of an item (the quote row and the form show them through /api/quotes/items/image/:id)
export async function itemImageUrl(ctx: AuthContext, fileId: string): Promise<string> {
  needQuotes(ctx, "view");
  if (!isId(fileId)) throw new ServiceError(404, "Picture not found");
  const row = await prisma.moduleFile.findFirst({ where: { id: fileId, module: "item", fieldKey: { in: ITEM_IMAGE_KEYS }, status: "READY", deletedAt: null, recordId: { not: null } }, select: { storagePath: true } });
  if (!row) throw new ServiceError(404, "Picture not found");
  const url = (await createReadUrls([row.storagePath]).catch(() => new Map<string, string>())).get(row.storagePath);
  if (!url) throw new ServiceError(404, "Picture not found");
  return url;
}

// ---------------------------------------------------------------------------
// The pick-lists of the New Item form: what the catalogue already uses, searchable, and always the standard ones
// ---------------------------------------------------------------------------
export type OptionKind = "categories" | "units" | "accounts" | "purchaseAccounts";
export const OPTION_KINDS: OptionKind[] = ["categories", "units", "accounts", "purchaseAccounts"];

export async function itemOptions(ctx: AuthContext, kind: OptionKind, q: string): Promise<LookupItem[]> {
  needQuoteWriter(ctx);
  const text = q.trim();
  const like = (s: string) => !text || s.toLowerCase().includes(text.toLowerCase());
  switch (kind) {
    case "categories": {
      const rows = await prisma.catalogItem.groupBy({ by: ["category"], where: { deletedAt: null, category: { not: null, ...(text ? contains(text) : {}) } }, _count: { _all: true }, orderBy: { category: "asc" }, take: 50 });
      return rows.flatMap(r => (r.category ? [{ id: r.category, label: r.category, sub: `${r._count._all} item${r._count._all === 1 ? "" : "s"}` }] : []));
    }
    case "units": {
      const used = await prisma.catalogItem.groupBy({ by: ["unit"], where: { deletedAt: null, unit: { not: null } }, _count: { _all: true } });
      const all = Array.from(new Set([...COMMON_UNITS, ...used.flatMap(u => (u.unit ? [u.unit] : []))]));
      return all.filter(like).slice(0, 80).map(u => ({ id: u, label: u }));
    }
    case "accounts": {
      const used = await prisma.catalogItem.groupBy({ by: ["inventoryAccount"], where: { deletedAt: null, inventoryAccount: { not: null } } });
      const all = Array.from(new Set([...INVENTORY_ACCOUNTS, ...used.flatMap(u => (u.inventoryAccount ? [u.inventoryAccount] : []))]));
      return all.filter(like).slice(0, 50).map(a => ({ id: a, label: a }));
    }
    case "purchaseAccounts": {
      const used = await prisma.catalogItem.groupBy({ by: ["purchaseAccount"], where: { deletedAt: null, purchaseAccount: { not: null } } });
      const all = Array.from(new Set([...PURCHASE_ACCOUNTS, ...used.flatMap(u => (u.purchaseAccount ? [u.purchaseAccount] : []))]));
      return all.filter(like).slice(0, 50).map(a => ({ id: a, label: a }));
    }
  }
}

// ---------------------------------------------------------------------------
// Export (the import of a file is in item-import.ts / item-import-server.ts)
// ---------------------------------------------------------------------------
export async function exportItems(ctx: AuthContext): Promise<string> {
  needQuotes(ctx, "export");
  const settings = await loadSettings();
  const tax = new Map(settings.taxes.map(t => [t.id, t.name]));
  const rows = await prisma.catalogItem.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, take: 20000 });
  const lines = [csvLine(["Item Name", "Description", "HSN/SAC", "Usage unit", "Rate", "Tax Name", "Product Type", "Status", "SKU", "Category Name", "Taxable"])];
  for (const r of rows) {
    lines.push(csvLine([
      r.name, r.description ?? "", r.hsn ?? "", r.unit ?? "", asNumber(r.rate).toFixed(2), r.taxId ? tax.get(r.taxId) ?? "" : "", r.kind === "Service" ? "service" : "goods",
      r.isActive ? "Active" : "Inactive", r.sku ?? "", r.category ?? "", isTaxable(r.taxPreference) ? "true" : "false",
    ]));
  }
  return "﻿" + lines.join("\r\n");
}
