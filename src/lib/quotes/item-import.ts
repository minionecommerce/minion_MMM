// Importing items from a CSV file (a Zoho Books item export, "Item.csv", has 81 columns). Pure: the Items page runs it in the browser for the preview, and the
// server runs the very same functions again on what it receives before it writes anything.
//
//   autoMapHeaders   which column of the file goes to which place of the Item Master (the person can change it)
//   buildItem        one row of the file -> the item it makes, and what is wrong with it (errors stop the row, warnings do not)
//   planImport       which rows are new, which are items that are already there (duplicates), which cannot be imported
//
// Nothing of the file is thrown away: a column that has no place of its own is kept with the item under its own name ("extra").

import {
  DEFAULT_DIM_UNIT, DEFAULT_VALUATION, DEFAULT_WEIGHT_UNIT, DIM_UNITS, IDENTIFIER_TYPES, INVENTORY_ACCOUNTS, MAX_DIMENSION, WEIGHT_UNITS, isTaxCode,
  type Identifier, type ItemKind,
} from "./item-constants";
import { isInterStateTax } from "./taxes";
import type { TaxDef } from "./types";

export const MAX_IMPORT_ROWS = 5000;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_EXTRA_VALUE = 2000;
export const MAX_LONG_EXTRA = 20000; // a description that did not fit in the 2000 characters of the Description box is kept whole
const MAX_MONEY = 99_999_999.99;

// ---------------------------------------------------------------------------
// Where a column can go
// ---------------------------------------------------------------------------
export type TargetKey =
  | "externalId" | "name" | "sku" | "upc" | "mpn" | "ean" | "isbn" | "returnable" | "brand" | "manufacturer" | "hsn" | "description" | "itemDescription" | "rate" | "mrp"
  | "packageWeight" | "packageLength" | "packageWidth" | "packageHeight" | "dimensionUnit" | "weightUnit" | "receivable" | "taxable" | "taxabilityType" | "kind"
  | "category" | "parentCategory" | "intraTaxName" | "intraTaxRate" | "interTaxName" | "interTaxRate" | "status" | "unit" | "costPrice" | "purchaseAccount" | "purchaseDescription"
  | "purchasable" | "inventoryAccount" | "valuationMethod" | "reorderPoint" | "trackInventory" | "trackBatches" | "taskTemplate";

export type Target = { key: TargetKey; label: string; group: string; aliases: string[] };

// Aliases are header names with everything but letters and digits taken out, lower case; for each place the first alias that the file has is used
export const TARGETS: Target[] = [
  { key: "externalId", label: "Item ID", group: "Identity", aliases: ["itemid", "zohoitemid", "externalid", "id"] },
  { key: "name", label: "Item Name", group: "Identity", aliases: ["itemname", "name", "item", "productname"] },
  { key: "sku", label: "SKU", group: "Identity", aliases: ["sku", "itemcode"] },
  { key: "upc", label: "UPC", group: "Identity", aliases: ["upc"] },
  { key: "mpn", label: "MPN", group: "Identity", aliases: ["mpn"] },
  { key: "ean", label: "EAN", group: "Identity", aliases: ["ean"] },
  { key: "isbn", label: "ISBN", group: "Identity", aliases: ["isbn"] },
  { key: "kind", label: "Type (Goods / Service)", group: "Identity", aliases: ["producttype", "type"] },
  { key: "brand", label: "Brand", group: "Identity", aliases: ["brand"] },
  { key: "manufacturer", label: "Manufacturer", group: "Identity", aliases: ["manufacturer"] },
  { key: "category", label: "Category", group: "Identity", aliases: ["categoryname", "category"] },
  { key: "parentCategory", label: "Parent Category", group: "Identity", aliases: ["parentcategory"] },
  { key: "hsn", label: "HSN / SAC", group: "Tax", aliases: ["hsnsac", "hsn", "sac", "hsncode"] },
  { key: "taxable", label: "Taxable", group: "Tax", aliases: ["taxable", "istaxable"] },
  { key: "taxabilityType", label: "Taxability Type", group: "Tax", aliases: ["taxabilitytype"] },
  { key: "intraTaxName", label: "Intra State Tax Name", group: "Tax", aliases: ["intrastatetaxname", "taxname", "tax", "gst"] },
  { key: "intraTaxRate", label: "Intra State Tax Rate", group: "Tax", aliases: ["intrastatetaxrate"] },
  { key: "interTaxName", label: "Inter State Tax Name", group: "Tax", aliases: ["interstatetaxname"] },
  { key: "interTaxRate", label: "Inter State Tax Rate", group: "Tax", aliases: ["interstatetaxrate"] },
  { key: "description", label: "Description", group: "Sales", aliases: ["description", "salesdescription"] },
  { key: "itemDescription", label: "Item Description (used when Description is empty)", group: "Sales", aliases: ["itemdescription"] },
  { key: "rate", label: "Selling Price (Rate)", group: "Sales", aliases: ["rate", "sellingprice", "salesrate", "price", "salesprice"] },
  { key: "mrp", label: "MRP", group: "Sales", aliases: ["mrp"] },
  { key: "unit", label: "Unit", group: "Sales", aliases: ["usageunit", "unit", "uom"] },
  { key: "status", label: "Status", group: "Sales", aliases: ["status", "active"] },
  { key: "returnable", label: "Returnable Item", group: "Sales", aliases: ["isreturnableitem", "returnableitem", "returnable"] },
  { key: "costPrice", label: "Purchase Rate (Cost Price)", group: "Purchase", aliases: ["purchaserate", "costprice", "purchaseprice"] },
  { key: "purchaseAccount", label: "Purchase Account", group: "Purchase", aliases: ["purchaseaccount"] },
  { key: "purchaseDescription", label: "Purchase Description", group: "Purchase", aliases: ["purchasedescription"] },
  { key: "purchasable", label: "Purchasable", group: "Purchase", aliases: ["purchasable"] },
  { key: "receivable", label: "Receivable Item", group: "Purchase", aliases: ["isreceivableservice", "receivableitem"] },
  { key: "trackInventory", label: "Track Inventory", group: "Inventory", aliases: ["trackinventory"] },
  { key: "trackBatches", label: "Track Batches", group: "Inventory", aliases: ["trackbatches"] },
  { key: "inventoryAccount", label: "Inventory Account", group: "Inventory", aliases: ["inventoryaccount"] },
  { key: "valuationMethod", label: "Inventory Valuation Method", group: "Inventory", aliases: ["inventoryvaluationmethod", "valuationmethod"] },
  { key: "reorderPoint", label: "Reorder Point", group: "Inventory", aliases: ["reorderpoint"] },
  { key: "packageWeight", label: "Package Weight", group: "Fulfilment", aliases: ["packageweight", "weight"] },
  { key: "packageLength", label: "Package Length", group: "Fulfilment", aliases: ["packagelength", "length"] },
  { key: "packageWidth", label: "Package Width", group: "Fulfilment", aliases: ["packagewidth", "width"] },
  { key: "packageHeight", label: "Package Height", group: "Fulfilment", aliases: ["packageheight", "height"] },
  { key: "dimensionUnit", label: "Dimension Unit", group: "Fulfilment", aliases: ["dimensionunit"] },
  { key: "weightUnit", label: "Weight Unit", group: "Fulfilment", aliases: ["weightunit"] },
  { key: "taskTemplate", label: "Task Template", group: "Additional", aliases: ["cftasktemplate", "tasktemplate"] },
];
export const TARGET_BY_KEY = new Map(TARGETS.map(t => [t.key as string, t]));

export const KEEP = "extra"; // a column with no place of its own: kept with the item under its own name
export const SKIP = "ignore"; // a column that is left out
export type Mapping = Record<string, string>; // header of the file -> a TargetKey, KEEP or SKIP

export const normHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

// The columns of the file placed by name. A column that has no place is kept (extra) when it has anything in it in some row, otherwise it is left out.
export function autoMapHeaders(headers: string[], rows: string[][] = []): Mapping {
  const mapping: Mapping = {};
  const normal = headers.map(normHeader);
  const taken = new Set<number>();
  for (const t of TARGETS) {
    for (const alias of t.aliases) {
      const at = normal.findIndex((h, i) => h === alias && !taken.has(i));
      if (at >= 0) { mapping[headers[at]] = t.key; taken.add(at); break; }
    }
  }
  headers.forEach((h, i) => {
    if (taken.has(i) && mapping[h]) return;
    const filled = rows.length === 0 ? true : rows.some(r => (r[i] ?? "").trim() !== "");
    mapping[h] = filled ? KEEP : SKIP;
  });
  return mapping;
}

// Two columns of the file may not go to the same place (except KEEP and SKIP): what is wrong with a mapping that was changed by hand
export function mappingProblem(mapping: Mapping): string | null {
  const used = new Map<string, string>();
  for (const [header, key] of Object.entries(mapping)) {
    if (key === KEEP || key === SKIP) continue;
    if (!TARGET_BY_KEY.has(key)) return `"${header}" goes to a place that does not exist.`;
    if (used.has(key)) return `"${used.get(key)}" and "${header}" both go to ${TARGET_BY_KEY.get(key)!.label}. Choose one of them.`;
    used.set(key, header);
  }
  if (![...used.keys()].includes("name")) return "One column has to be the Item Name.";
  return null;
}

// ---------------------------------------------------------------------------
// Reading what is in a cell
// ---------------------------------------------------------------------------
// "INR 1,200.00" -> 1200. Nothing in it -> null. Something that is not an amount -> NaN.
export function parseMoney(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const found = t.match(/-?(?:\d[\d,]*(?:\.\d+)?|\.\d+)/);
  if (!found) return NaN;
  if (/\d/.test(t.replace(found[0], ""))) return NaN; // two numbers, or letters inside the number
  const n = Number(found[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export function parseFlag(v: string): boolean | null {
  const t = v.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active"].includes(t)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(t)) return false;
  return null;
}

const clip = (v: string, max: number) => v.trim().slice(0, max);

// ---------------------------------------------------------------------------
// One row -> one item
// ---------------------------------------------------------------------------
export type ImportIssue = { level: "error" | "warning"; message: string };

export type ItemData = {
  name: string; description: string | null; hsn: string | null; unit: string | null; unitGroup: null; rate: number; taxId: string | null; interTaxId: string | null;
  kind: ItemKind; isActive: boolean; category: string | null; sku: string | null; taxPreference: string; identifiers: Identifier[];
  trackInventory: boolean; inventoryTracking: string; inventoryAccount: string | null; valuationMethod: string; reorderPoint: number | null; returnable: boolean;
  dimLength: number | null; dimWidth: number | null; dimHeight: number | null; dimUnit: string; weight: number | null; weightUnit: string; taskTemplateId: string | null;
  purchaseInfo: boolean; costPrice: number | null; purchaseAccount: string | null; purchaseDescription: string | null; receivable: boolean;
  externalId: string | null; brand: string | null; manufacturer: string | null; mrp: number | null; extra: Record<string, string> | null;
};

export type BuiltItem = {
  name: string; externalId: string | null; sku: string | null;
  data: ItemData | null; // null when the row cannot be imported
  issues: ImportIssue[];
  unknownTemplate: string | null; // a Task Template of the file that is not in the Project template list
};

export type Lookups = { taxes: readonly TaxDef[]; templates: readonly { id: string; label: string }[] };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function buildItem(values: Record<string, string>, mapping: Mapping, lookups: Lookups): BuiltItem {
  const issues: ImportIssue[] = [];
  const err = (m: string) => issues.push({ level: "error", message: m });
  const warn = (m: string) => issues.push({ level: "warning", message: m });

  // what each place of the Item Master gets from the file, and which header it was
  const got: Partial<Record<TargetKey, string>> = {};
  const headerOf: Partial<Record<TargetKey, string>> = {};
  const kept: [string, string][] = [];
  for (const [header, key] of Object.entries(mapping)) {
    const value = (values[header] ?? "").trim();
    if (key === SKIP) continue;
    if (key === KEEP) { if (value !== "") kept.push([header, value]); continue; }
    got[key as TargetKey] = value;
    headerOf[key as TargetKey] = header;
  }
  const v = (k: TargetKey) => got[k] ?? "";
  const has = (k: TargetKey) => k in got;

  const name = v("name");
  const externalId = v("externalId") || null;
  const sku = v("sku") ? clip(v("sku"), 100) : null;
  const base = { name, externalId, sku };
  const fail = (): BuiltItem => ({ ...base, data: null, issues, unknownTemplate: null });

  if (!name) { err("There is no item name."); return fail(); }
  if (name.length > 200) { err("The item name is longer than 200 characters."); return fail(); }
  if (externalId && externalId.length > 100) { err("The Item ID is longer than 100 characters."); return fail(); }

  const money = (k: TargetKey, what: string, required = false): number | null => {
    const n = parseMoney(v(k));
    if (n === null) return required ? 0 : null;
    if (Number.isNaN(n) || n < 0 || n > MAX_MONEY) { err(`${what} "${v(k).slice(0, 30)}" is not a valid amount.`); return null; }
    return Math.round(n * 100) / 100;
  };
  const rate = money("rate", "The rate", true) ?? 0;
  const mrpRaw = money("mrp", "The MRP");
  const mrp = mrpRaw !== null && mrpRaw > 0 ? mrpRaw : null; // 0.00 in the file means "no MRP"
  const costRaw = money("costPrice", "The purchase rate");

  // Goods or Service
  const kindText = v("kind").toLowerCase();
  const kind: ItemKind = kindText.startsWith("serv") ? "Service" : "Goods";
  if (has("kind") && kindText && !kindText.startsWith("serv") && !kindText.startsWith("good") && !kindText.startsWith("prod")) warn(`The type "${v("kind").slice(0, 20)}" is not Goods or Service, so the item is Goods.`);
  const goods = kind === "Goods";

  // HSN / SAC: the digits, 2 to 8 of them
  const codeText = v("hsn");
  const code = codeText.replace(/[\s.\-]/g, "");
  if (codeText && !isTaxCode(code)) warn(`The HSN/SAC "${codeText.slice(0, 30)}" is not a number of 2 to 8 digits, so it was left empty.`);

  // taxes: by name in Quote Settings, else by rate
  const taxable = parseFlag(v("taxable"));
  const taxTypeText = v("taxabilityType").toLowerCase();
  let taxPreference = "taxable";
  if (has("taxable") && taxable === false) taxPreference = taxTypeText.includes("non-gst") || taxTypeText.includes("non gst") ? "non_gst" : taxTypeText.includes("out of scope") ? "out_of_scope" : "non_taxable";
  const isTaxable = taxPreference === "taxable";
  const pickTax = (nameKey: TargetKey, rateKey: TargetKey, inter: boolean): string | null => {
    const nm = v(nameKey);
    if (!nm) return null;
    const byName = lookups.taxes.find(t => same(t.name, nm));
    if (byName) return byName.id;
    const rateNum = parseMoney(v(rateKey));
    const byRate = rateNum !== null && !Number.isNaN(rateNum) ? lookups.taxes.find(t => t.active && t.rate === rateNum && isInterStateTax(t) === inter) : undefined;
    if (byRate) { warn(`The tax "${nm}" is not in Quote Settings; "${byRate.name}" (same rate) was used.`); return byRate.id; }
    warn(`The tax "${nm}" is not in Quote Settings, so the item has no default ${inter ? "inter state" : "intra state"} tax.`);
    return null;
  };
  const taxId = isTaxable ? pickTax("intraTaxName", "intraTaxRate", false) : null;
  const interTaxId = isTaxable ? pickTax("interTaxName", "interTaxRate", true) : null;

  // the unit
  const unitText = v("unit");
  if (unitText.length > 20) warn(`The unit "${unitText.slice(0, 24)}…" is longer than 20 characters and was cut.`);
  const unit = unitText ? clip(unitText, 20) : null;

  // descriptions: Description, else Item Description; the other one is kept when it says something else
  const desc1 = v("description"); const desc2 = v("itemDescription");
  let description = desc1 || desc2;
  const extra: Record<string, string> = {};
  if (description.length > 2000) {
    warn("The description is longer than 2000 characters; the item has the first 2000 and the whole text is kept with it.");
    extra[(desc1 ? headerOf.description : headerOf.itemDescription) ?? "Description"] = description.slice(0, MAX_LONG_EXTRA);
    description = description.slice(0, 2000);
  }
  const keep = (header: string | undefined, value: string) => { if (header && value !== "") extra[header] = value.slice(0, MAX_EXTRA_VALUE); };
  if (desc1 && desc2 && !same(desc1, desc2)) keep(headerOf.itemDescription, desc2);

  // identifiers
  const identifiers: Identifier[] = [];
  for (const [k, type] of [["upc", "UPC"], ["ean", "EAN"], ["isbn", "ISBN"], ["mpn", "MPN"]] as const) {
    if (v(k) && IDENTIFIER_TYPES.includes(type)) identifiers.push({ type, value: clip(v(k), 100) });
  }

  // category: "Parent / Category" when there is a parent
  const cat = v("category"); const parent = v("parentCategory");
  const category = cat ? clip(parent ? `${parent} / ${cat}` : cat, 100) : parent ? clip(parent, 100) : null;

  // stock (Goods only; a Service has none)
  const track = goods && parseFlag(v("trackInventory")) === true;
  const batches = parseFlag(v("trackBatches")) === true;
  const valuation = ["fifo", "wac"].includes(v("valuationMethod").toLowerCase()) ? v("valuationMethod").toLowerCase() : DEFAULT_VALUATION;
  const inventoryAccount = track ? clip(v("inventoryAccount") || INVENTORY_ACCOUNTS[0], 100) : null;
  if (!track && v("inventoryAccount")) keep(headerOf.inventoryAccount, v("inventoryAccount"));
  if (!track && v("valuationMethod")) keep(headerOf.valuationMethod, v("valuationMethod"));
  let reorderPoint: number | null = null;
  if (track && v("reorderPoint")) {
    const n = parseMoney(v("reorderPoint"));
    if (n === null || Number.isNaN(n) || n < 0) warn(`The reorder point "${v("reorderPoint").slice(0, 20)}" is not valid and was left empty.`);
    else reorderPoint = n;
  }
  if (!track && batches) keep(headerOf.trackBatches, v("trackBatches"));

  // returns, size and weight (Goods only)
  const returnable = goods && parseFlag(v("returnable")) === true;
  const dim = (k: TargetKey) => { const n = parseMoney(v(k)); return n !== null && !Number.isNaN(n) && n > 0 && n <= MAX_DIMENSION ? n : null; };
  const dimLength = goods ? dim("packageLength") : null;
  const dimWidth = goods ? dim("packageWidth") : null;
  const dimHeight = goods ? dim("packageHeight") : null;
  const weight = goods ? dim("packageWeight") : null;
  const dimUnit = DIM_UNITS.includes(v("dimensionUnit").toLowerCase()) ? v("dimensionUnit").toLowerCase() : DEFAULT_DIM_UNIT;
  const weightUnit = WEIGHT_UNITS.includes(v("weightUnit").toLowerCase()) ? v("weightUnit").toLowerCase() : DEFAULT_WEIGHT_UNIT;

  // Purchase Information: ticked when the file says the item is purchasable (or, without that column, when there is a purchase rate over 0 or an account)
  const purchasableFlag = parseFlag(v("purchasable"));
  const purchaseAccount = v("purchaseAccount") ? clip(v("purchaseAccount"), 100) : null;
  const purchaseInfo = has("purchasable") && purchasableFlag !== null ? purchasableFlag : (costRaw ?? 0) > 0 || !!purchaseAccount;
  let purchaseDescription: string | null = v("purchaseDescription") ? v("purchaseDescription").slice(0, 2000) : null;
  if (v("purchaseDescription").length > 2000) warn("The purchase description is longer than 2000 characters and was cut.");
  const receivableFlag = parseFlag(v("receivable")) === true;
  if (!purchaseInfo) {
    // not purchasable: what the file says about buying it is still kept with the item
    if (costRaw !== null && costRaw > 0) keep(headerOf.costPrice, v("costPrice"));
    if (purchaseAccount) keep(headerOf.purchaseAccount, purchaseAccount);
    if (purchaseDescription) keep(headerOf.purchaseDescription, purchaseDescription);
    if (receivableFlag) keep(headerOf.receivable, v("receivable"));
    purchaseDescription = null;
  }

  // Task Template: by the name it has in the Project template list
  let taskTemplateId: string | null = null;
  let unknownTemplate: string | null = null;
  if (v("taskTemplate")) {
    const found = lookups.templates.find(t => same(t.label, v("taskTemplate")));
    if (found) taskTemplateId = found.id;
    else { unknownTemplate = v("taskTemplate"); keep(headerOf.taskTemplate, v("taskTemplate")); warn(`The Task Template "${v("taskTemplate").slice(0, 40)}" is not in the Project template list; it is kept with the item.`); }
  }

  // not taxable: the reason is kept
  if (!isTaxable) { keep(headerOf.taxable, v("taxable")); keep(headerOf.taxabilityType, v("taxabilityType")); }

  // every column that has no place of its own
  for (const [header, value] of kept) {
    if (same(value, name) || (description && same(value, description))) continue; // "Product Name" and the second description say what is already there
    extra[header] = value.slice(0, MAX_EXTRA_VALUE);
  }

  const data: ItemData = {
    name, description: description || null, hsn: isTaxCode(code) ? code : null, unit, unitGroup: null, rate, taxId, interTaxId, kind,
    isActive: has("status") ? parseFlag(v("status")) !== false : true, category, sku, taxPreference, identifiers,
    trackInventory: track, inventoryTracking: track && batches ? "batch" : "none", inventoryAccount, valuationMethod: track ? valuation : DEFAULT_VALUATION, reorderPoint, returnable,
    dimLength, dimWidth, dimHeight, dimUnit, weight, weightUnit, taskTemplateId,
    purchaseInfo, costPrice: purchaseInfo ? costRaw ?? 0 : null, purchaseAccount: purchaseInfo ? purchaseAccount : null, purchaseDescription: purchaseInfo ? purchaseDescription : null,
    receivable: purchaseInfo && receivableFlag,
    externalId, brand: v("brand") ? clip(v("brand"), 100) : null, manufacturer: v("manufacturer") ? clip(v("manufacturer"), 100) : null, mrp,
    extra: Object.keys(extra).length ? extra : null,
  };
  if (issues.some(i => i.level === "error")) return { ...base, data: null, issues, unknownTemplate };
  return { ...base, data, issues, unknownTemplate };
}

// ---------------------------------------------------------------------------
// Which rows are new, which are there already
// ---------------------------------------------------------------------------
export type ExistingKey = { id: string; externalId: string | null; name: string; sku: string | null };
export type DuplicateMode = "skip" | "update";
export type RowStatus = "new" | "update" | "duplicate" | "invalid";
export type PlanRow = { line: number; status: RowStatus; name: string; externalId: string | null; reason: string; matchedId: string | null; issues: ImportIssue[] };

const nameSku = (name: string, sku: string | null) => `${name.trim().toLowerCase()}|${(sku ?? "").trim().toLowerCase()}`;

// An item is the same item when it has the same Item ID. A row without an Item ID is the same item when name and SKU are the same. An item of the Items
// module that was made by hand (no Item ID) is the same as the first row of the file that has its name and SKU; the other rows with that name are other items.
// Rows are looked at in the order of the file.
export function planImport(rows: { line: number; item: BuiltItem }[], existing: readonly ExistingKey[], mode: DuplicateMode): PlanRow[] {
  const byExternal = new Map<string, ExistingKey>();
  const byNameSku = new Map<string, ExistingKey[]>();
  for (const e of existing) {
    if (e.externalId) byExternal.set(e.externalId, e);
    const k = nameSku(e.name, e.sku);
    byNameSku.set(k, [...(byNameSku.get(k) ?? []), e]);
  }
  const claimed = new Set<string>(); // items made by hand that a row of the file has been matched to
  const seenExternal = new Set<string>();
  const seenNameSku = new Set<string>();
  const out: PlanRow[] = [];

  for (const { line, item } of rows) {
    const row = (status: RowStatus, reason: string, matchedId: string | null = null): PlanRow => ({ line, status, name: item.name, externalId: item.externalId, reason, matchedId, issues: item.issues });
    if (!item.data) { out.push(row("invalid", item.issues.find(i => i.level === "error")?.message ?? "Not valid.")); continue; }
    const key = nameSku(item.name, item.sku);
    const dup = (reason: string, matched: ExistingKey | null): PlanRow => (matched && mode === "update" ? row("update", reason, matched.id) : row("duplicate", reason, matched?.id ?? null));

    if (item.externalId) {
      const there = byExternal.get(item.externalId);
      if (there) { out.push(dup("This Item ID is already in the Items module.", there)); continue; }
      if (seenExternal.has(item.externalId)) { out.push(row("duplicate", "This Item ID is in the file twice.")); continue; }
      seenExternal.add(item.externalId);
      const manual = (byNameSku.get(key) ?? []).find(e => !e.externalId && !claimed.has(e.id));
      if (manual) { claimed.add(manual.id); out.push(dup("An item with the same name and SKU is already in the Items module.", manual)); continue; }
      const shared = (byNameSku.get(key)?.length ?? 0) > 0 || seenNameSku.has(key);
      seenNameSku.add(key);
      out.push(row("new", shared ? "Shares its name with another item (a different Item ID), so it is added as a separate item." : ""));
      continue;
    }
    const there = (byNameSku.get(key) ?? [])[0];
    if (there) { out.push(dup("An item with the same name and SKU is already in the Items module.", there)); continue; }
    if (seenNameSku.has(key)) { out.push(row("duplicate", "The same name and SKU are in the file twice.")); continue; }
    seenNameSku.add(key);
    out.push(row("new", ""));
  }
  return out;
}

export type PlanSummary = { total: number; new: number; update: number; duplicate: number; invalid: number; withWarnings: number };
export function summarizePlan(plan: readonly PlanRow[]): PlanSummary {
  const s: PlanSummary = { total: plan.length, new: 0, update: 0, duplicate: 0, invalid: 0, withWarnings: 0 };
  for (const p of plan) { s[p.status]++; if (p.issues.some(i => i.level === "warning")) s.withWarnings++; }
  return s;
}

// A row of the file by the names of its columns
export const rowValues = (headers: readonly string[], row: readonly string[]): Record<string, string> => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]));
