// The Item Master (the New Item form of the Quote page): the lists it offers and the small rules that decide what is asked for Goods and for a Service.
// Pure: the server checks what was sent with the same lists the form shows. No server-only imports here.

export const ITEM_KINDS = ["Goods", "Service"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export const isItemKind = (v: unknown): v is ItemKind => v === "Goods" || v === "Service";

// Goods are told by an HSN code, a Service by a SAC. The label of the field, and the words printed under an item on the quote.
export const taxCodeField = (kind: ItemKind) => (kind === "Service" ? "SAC" : "HSN Code");
export const taxCodePrint = (kind: ItemKind | null | undefined) => (kind === "Service" ? "SAC Code" : kind === "Goods" ? "HSN Code" : "HSN/SAC Code");
export const taxCodeShort = (kind: ItemKind | null | undefined) => (kind === "Service" ? "SAC" : kind === "Goods" ? "HSN" : "HSN/SAC");

// The code is typed as plain numbers, 2 to 8 digits (a code can start with 0, so it is text and never a number), not picked from a list.
export const TAX_CODE_MIN = 2;
export const TAX_CODE_MAX = 8;
export const isTaxCode = (v: string) => /^\d{2,8}$/.test(v);
// What stays of whatever was typed or pasted ("8536 50 90", "HSN-9983"): its digits, as many as a code can have
export const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, TAX_CODE_MAX);

export type Choice = { id: string; label: string };

export const TAX_PREFERENCES: Choice[] = [
  { id: "taxable", label: "Taxable" },
  { id: "non_taxable", label: "Non-Taxable" },
  { id: "out_of_scope", label: "Out of Scope" },
  { id: "non_gst", label: "Non-GST Supply" },
];
export const DEFAULT_TAX_PREFERENCE = "taxable";
export const isTaxable = (preference: string | null | undefined) => !preference || preference === DEFAULT_TAX_PREFERENCE;

export const INVENTORY_TRACKING: Choice[] = [{ id: "none", label: "None" }, { id: "batch", label: "Batch" }];
export const VALUATION_METHODS: Choice[] = [{ id: "fifo", label: "FIFO (First In, First Out)" }, { id: "wac", label: "WAC (Weighted Average Cost)" }];
export const DEFAULT_VALUATION = "fifo";
export const INVENTORY_ACCOUNTS = ["Inventory Asset", "Finished Goods", "Raw Materials", "Work in Progress", "Stores and Spares"];
// The account a purchase of the item is booked to (Purchase Information); a new one can be typed
export const PURCHASE_ACCOUNTS = ["Cost of Goods Sold", "Purchases", "Materials and Supplies", "Labour and Contract Work", "Freight and Transport", "Other Expenses"];

export const DIM_UNITS = ["cm", "mm", "in", "ft", "m"];
export const WEIGHT_UNITS = ["kg", "g", "lb", "oz"];
export const DEFAULT_DIM_UNIT = "cm";
export const DEFAULT_WEIGHT_UNIT = "kg";
export const MAX_DIMENSION = 999_999.999;

// Units. A unit group is a family of units (length, area ...): choosing a group sets its first unit as the unit of the item.
export type UnitGroup = { id: string; label: string; units: string[] };
export const UNIT_GROUPS: UnitGroup[] = [
  { id: "quantity", label: "Quantity", units: ["nos", "pcs", "set", "pair", "dozen", "box", "pack", "bag", "bundle", "roll", "sheet", "lot"] },
  { id: "length", label: "Length", units: ["m", "cm", "mm", "ft", "inch", "rft", "rm"] },
  { id: "area", label: "Area", units: ["sqft", "sqm", "sqyd"] },
  { id: "weight", label: "Weight", units: ["kg", "g", "ton", "quintal"] },
  { id: "volume", label: "Volume", units: ["ltr", "ml", "cum", "cft"] },
  { id: "time", label: "Time", units: ["hr", "day", "week", "month", "year"] },
];
export const unitGroupOf = (id: string | null | undefined): UnitGroup | null => UNIT_GROUPS.find(g => g.id === id) ?? null;
export const COMMON_UNITS: string[] = Array.from(new Set(UNIT_GROUPS.flatMap(g => g.units)));

// Other numbers an item can be known by (the "Add Identifier" link)
export const IDENTIFIER_TYPES = ["UPC", "EAN", "ISBN", "MPN", "Part Number", "Model Number"];
export const MAX_IDENTIFIERS = 10;
export type Identifier = { type: string; value: string };

// Pictures: a front picture, a rear picture and the others, 15 in all, 5 MB each. They are files of the module "item".
export const ITEM_IMAGE_FIELDS = { front: "imageFront", rear: "imageRear", other: "imageOther" } as const;
export const ITEM_IMAGE_KEYS: string[] = Object.values(ITEM_IMAGE_FIELDS);
export const MAX_ITEM_IMAGES = 15;
export const MAX_OTHER_IMAGES = MAX_ITEM_IMAGES - 2;
export const ITEM_IMAGE_MAX_MB = 5;
export const ITEM_IMAGE_MAX_BYTES = ITEM_IMAGE_MAX_MB * 1024 * 1024;
export const ITEM_IMAGE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
export const isItemImageName = (name: string) => {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return !!ITEM_IMAGE_TYPES[ext];
};
export const ITEM_IMAGE_HINT = "Use a PNG, JPG, WEBP or GIF picture.";

// What the form can ask for, by kind: a Service has no stock, no returns and nothing to ship
export const hasInventory = (kind: ItemKind) => kind === "Goods";
export const hasFulfilment = (kind: ItemKind) => kind === "Goods";
