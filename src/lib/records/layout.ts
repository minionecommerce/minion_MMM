// Edit Page Layout of the four record modules (Material Vendor, Service Vendor, Pre-Payment, Payment Collection).
// Every module has its own layout: one JSON row in ModuleLayout with what a Super Admin changed on top of the standard
// layout in registry.ts. Nothing here touches another module's layout.
//
//   fields    changes to standard fields: label, required, shown or hidden, default, section, dropdown options, currency
//   custom    fields added with New Field (their values live in the record's customFields)
//   sections  the order and names of the sections, and the sections added with New Section
//   order     the order of all fields
//   columns   the fields that are columns of the list page, in order

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit, type SecurityAction } from "@/lib/audit";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { removeObjects } from "@/lib/leads/storage";
import { MODULES, PROJECT_STATUS_DEFAULT, PROJECT_TEMPLATE_FIELD, type ModuleDef, type SystemField } from "./registry";
import {
  CUSTOM_TYPE_SET, CURRENCY_CODES, DEFAULT_CURRENCY, FIELD_LABEL_MAX, MAX_CUSTOM_FIELDS, MAX_CUSTOM_SECTIONS, MAX_OPTIONS, OPTION_LABEL_MAX,
  SECTION_LABEL_MAX, TABLE_COLUMN_TYPES, typeChoicesFor,
  LOOKUP_TARGET_SET,
  type CustomFieldType, type FieldOption, type FieldType, type LayoutField, type LayoutSection, type LookupKind, type ModuleId, type ModuleLayoutDto,
} from "./types";
import { cleanValue, plainField } from "./values";

type Tx = Prisma.TransactionClient;
type Db = Tx | typeof prisma;
const TX = { maxWait: 10_000, timeout: 20_000 };
export const ROW_PARENT_KEY = "vendorId"; // the rows of a table section point to their record with this column (unless the table says otherwise)
const parentKeyOf = (t: { parentKey?: string }) => t.parentKey ?? ROW_PARENT_KEY;
const parentRelationOf = (t: { parentRelation?: string }) => t.parentRelation ?? "vendor";

// ---------------------------------------------------------------------------
// What is stored
// ---------------------------------------------------------------------------
type StoredOverride = {
  label?: string; required?: boolean; enabled?: boolean; defaultValue?: string | null; section?: string;
  options?: FieldOption[]; currency?: string; maxFiles?: number;
};
type StoredCustom = {
  key: string; label: string; type: CustomFieldType; section: string; required: boolean; enabled: boolean;
  defaultValue: string | null; options: FieldOption[]; currency?: string; maxFiles?: number; lookup?: LookupKind;
};
type StoredSection = { id: string; label?: string; custom?: boolean };
export type Stored = { sections?: StoredSection[]; fields?: Record<string, StoredOverride>; custom?: StoredCustom[]; order?: string[]; columns?: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const list = <T>(v: unknown, ok: (x: unknown) => boolean): T[] => (Array.isArray(v) ? (v.filter(ok) as T[]) : []);

function asStored(value: unknown): Stored {
  const v = isObject(value) ? value : {};
  const isKey = (x: unknown) => typeof x === "string";
  return {
    sections: v.sections === undefined ? undefined : list<StoredSection>(v.sections, x => isObject(x) && isKey(x.id)),
    fields: isObject(v.fields) ? (v.fields as Record<string, StoredOverride>) : undefined,
    custom: list<StoredCustom>(v.custom, x => isObject(x) && isKey(x.key) && isKey(x.type)),
    order: v.order === undefined ? undefined : list<string>(v.order, isKey),
    columns: v.columns === undefined ? undefined : list<string>(v.columns, isKey),
  };
}

export async function readStored(moduleId: ModuleId, db: Db = prisma): Promise<Stored> {
  const row = await db.moduleLayout.findUnique({ where: { module: moduleId }, select: { value: true } });
  return asStored(row?.value);
}

const uniq = <T>(xs: T[]) => Array.from(new Set(xs));
// Names typed by the Super Admin: control characters become spaces, runs of spaces become one
const tidy = (s: string) => s.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
const newKey = () => `cf_${randomBytes(5).toString("hex")}`;
const newOptionId = () => `o_${randomBytes(5).toString("hex")}`;
const newSectionId = () => `s_${randomBytes(4).toString("hex")}`;

// ---------------------------------------------------------------------------
// The layout the screens use
// ---------------------------------------------------------------------------
export function buildLayout(def: ModuleDef, stored: Stored): ModuleLayoutDto {
  // sections
  const known = new Map<string, LayoutSection>();
  for (const s of def.sections) known.set(s.id, { id: s.id, label: s.label, kind: s.kind, isSystem: true });
  for (const s of stored.sections ?? []) if (s.custom) known.set(s.id, { id: s.id, label: (s.label || "Section").slice(0, SECTION_LABEL_MAX), kind: "FORM", isSystem: false });
  for (const s of stored.sections ?? []) {
    const k = known.get(s.id);
    if (k && k.isSystem && s.label?.trim()) k.label = s.label.trim().slice(0, SECTION_LABEL_MAX);
  }
  const sectionOrder: string[] = [];
  for (const s of stored.sections ?? []) if (known.has(s.id) && !sectionOrder.includes(s.id)) sectionOrder.push(s.id);
  for (const id of known.keys()) if (!sectionOrder.includes(id)) sectionOrder.push(id);
  const sections = sectionOrder.map(id => known.get(id)!);
  const formIds = new Set(sections.filter(s => s.kind === "FORM").map(s => s.id));
  const fixedIds = new Set(sections.filter(s => s.kind === "FIXED").map(s => s.id));
  const firstForm = sections.find(s => s.kind === "FORM")!.id;
  const tableSections = new Set(def.tables.map(t => t.section));

  // fields
  const standard: { f: SystemField; table: boolean }[] = [
    ...def.fields.map(f => ({ f, table: false })),
    ...def.tables.flatMap(t => t.fields.map(f => ({ f, table: true }))),
  ];
  const fields: LayoutField[] = [];
  for (const { f, table } of standard) {
    const o = stored.fields?.[f.key] ?? {};
    const locked = !!f.requiredLocked;
    const type = f.type;
    const section = table || fixedIds.has(f.section) ? f.section : o.section && formIds.has(o.section) ? o.section : f.section;
    const options = type === "DROPDOWN" ? (Array.isArray(o.options) ? o.options : f.options ?? []) : [];
    const defaultable = !(type === "AUTO" || type === "LOOKUP" || type === "APPROVER" || type === "FILE" || f.readOnly);
    let defaultValue: string | null = defaultable ? (o.defaultValue !== undefined ? o.defaultValue : f.default ?? null) : f.readOnly ? f.default ?? null : null;
    if (type === "DROPDOWN" && defaultValue && !options.some(x => x.id === defaultValue)) defaultValue = null;
    const currency = type === "CURRENCY" ? o.currency ?? DEFAULT_CURRENCY : DEFAULT_CURRENCY;
    fields.push({
      key: f.key,
      label: o.label?.trim() ? o.label.trim().slice(0, FIELD_LABEL_MAX) : f.label,
      type,
      isSystem: true,
      section,
      required: locked ? !!f.required : o.required ?? !!f.required,
      requiredLocked: locked,
      enabled: locked ? true : o.enabled ?? !f.hidden,
      readOnly: !!f.readOnly,
      inList: false,
      listable: !table && !f.notListable && type !== "FILE" && (type !== "AUTO" || !!f.listed),
      defaultValue,
      defaultable,
      options,
      lookup: f.lookup ?? null,
      prefix: type === "CURRENCY" ? (o.currency ? o.currency : f.prefix ?? currency) : null,
      currency,
      maxFiles: type === "FILE" ? o.maxFiles ?? f.maxFiles ?? 3 : 1,
      maxLength: f.max ?? null,
      integer: !!f.integer,
      min: f.min ?? null,
      typeChoices: [],
    });
  }
  for (const c of stored.custom ?? []) {
    const inTable = tableSections.has(c.section);
    const section = inTable ? c.section : formIds.has(c.section) ? c.section : firstForm;
    const options = (c.type === "DROPDOWN" || c.type === "MULTISELECT") && Array.isArray(c.options) ? c.options : [];
    const currency = c.type === "CURRENCY" ? c.currency ?? DEFAULT_CURRENCY : DEFAULT_CURRENCY;
    fields.push({
      key: c.key,
      label: String(c.label ?? "Field").slice(0, FIELD_LABEL_MAX),
      type: c.type,
      isSystem: false,
      section,
      required: !!c.required,
      requiredLocked: false,
      enabled: c.enabled !== false,
      readOnly: false,
      inList: false,
      listable: !inTable && c.type !== "FILE",
      defaultValue: c.type === "MULTISELECT" || (c.type === "DROPDOWN" && c.defaultValue && !options.some(x => x.id === c.defaultValue)) ? null : c.defaultValue ?? null,
      defaultable: c.type !== "FILE" && c.type !== "LOOKUP" && c.type !== "MULTISELECT",
      options,
      lookup: c.type === "LOOKUP" && c.lookup && LOOKUP_TARGET_SET.has(c.lookup) ? c.lookup : null,
      prefix: c.type === "CURRENCY" ? currency : null,
      currency,
      maxFiles: c.type === "FILE" ? c.maxFiles ?? 3 : 1,
      maxLength: null,
      integer: false,
      min: null,
      typeChoices: typeChoicesFor(c.type, false, inTable),
    });
  }

  // order
  const byKey = new Map(fields.map(f => [f.key, f]));
  const keys = uniq([...(stored.order ?? []).filter(k => byKey.has(k)), ...fields.map(f => f.key)]);
  const ordered = keys.map(k => byKey.get(k)!);

  // list columns: the saved ones, or the standard ones; a hidden field keeps its place but is not shown
  const defaultColumns = def.defaultColumns ?? standard.filter(({ f, table }) => !table && f.listed).map(({ f }) => f.key);
  const columns = uniq(stored.columns ?? defaultColumns).filter(k => {
    const f = byKey.get(k);
    return !!f && f.listable && f.enabled;
  });
  for (const f of ordered) f.inList = columns.includes(f.key);

  return { module: def.id, sections, fields: ordered, columns };
}

export async function getLayout(moduleId: ModuleId): Promise<ModuleLayoutDto> {
  return buildLayout(MODULES[moduleId], await readStored(moduleId));
}

// ---------------------------------------------------------------------------
// Saving a change: one transaction, one audit entry, and a lock on the module so two Super Admins cannot overwrite each other
// ---------------------------------------------------------------------------
type Audit = { action: SecurityAction; oldValue?: Prisma.InputJsonValue; newValue?: Prisma.InputJsonValue };

async function saveLayout(
  ctx: AuthContext,
  moduleId: ModuleId,
  change: (stored: Stored, layout: ModuleLayoutDto) => Stored,
  audit: Audit,
  alongside?: (tx: Tx) => Promise<void>,
): Promise<ModuleLayoutDto> {
  assertSuperAdmin(ctx);
  const def = MODULES[moduleId];
  return prisma.$transaction(async tx => {
    // Held until this transaction ends. It works before the module's row exists too, which a row lock cannot.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ModuleLayout:${moduleId}`}))`;
    const stored = await readStored(moduleId, tx);
    const next = change(stored, buildLayout(def, stored));
    await tx.$executeRaw`INSERT INTO "ModuleLayout" ("module", "value", "updatedAt") VALUES (${moduleId}, ${JSON.stringify(next)}::jsonb, now())
      ON CONFLICT ("module") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now()`;
    if (alongside) await alongside(tx);
    await writeAudit({ action: audit.action, actorUserId: ctx.userId, oldValue: audit.oldValue, newValue: { module: moduleId, ...((audit.newValue as object) ?? {}) } }, tx);
    return buildLayout(def, next);
  }, TX);
}

// ---------------------------------------------------------------------------
// Checking what a Super Admin typed
// ---------------------------------------------------------------------------
function cleanLabel(raw: string, layout: ModuleLayoutDto, exceptKey?: string) {
  const label = tidy(raw);
  if (!label) throw new ServiceError(400, "Field label is required.");
  if (label.length > FIELD_LABEL_MAX) throw new ServiceError(400, `Field label must be ${FIELD_LABEL_MAX} characters or fewer.`);
  if (layout.fields.some(f => f.key !== exceptKey && f.label.toLowerCase() === label.toLowerCase())) throw new ServiceError(409, `Another field is already called "${label}".`);
  return label;
}

function cleanOptionName(raw: string, existing: FieldOption[], exceptId?: string) {
  const name = tidy(raw);
  if (!name) throw new ServiceError(400, "Option name is required.");
  if (name.length > OPTION_LABEL_MAX) throw new ServiceError(400, `Option name must be ${OPTION_LABEL_MAX} characters or fewer.`);
  if (existing.some(o => o.id !== exceptId && o.label.toLowerCase() === name.toLowerCase())) throw new ServiceError(409, `"${name}" is already in the list.`);
  return name;
}

function newOptions(names: string[]): FieldOption[] {
  if (names.length > MAX_OPTIONS) throw new ServiceError(400, `A list can have up to ${MAX_OPTIONS} options.`);
  const options: FieldOption[] = [];
  for (const raw of names) options.push({ id: newOptionId(), label: cleanOptionName(raw, options) });
  return options;
}

// The default a field starts with: checked against the field's type. Returns what is stored (null = no default).
async function cleanDefault(type: FieldType, options: FieldOption[], raw: string | null | undefined): Promise<string | null> {
  const v = (raw ?? "").trim();
  if (!v) return null;
  switch (type) {
    case "DATE":
      if (v === "@today") return v;
      break;
    case "DATETIME":
      if (v === "@now") return v;
      break;
    case "CHECKBOX":
      if (v !== "true" && v !== "false") throw new ServiceError(400, "Default value must be Yes or No.");
      return v === "true" ? "true" : null;
    case "USER": {
      if (v === "@me") return v;
      const user = await prisma.user.findFirst({ where: { id: v, status: "ACTIVE", deletedAt: null }, select: { id: true } });
      if (!user) throw new ServiceError(400, "Default value must be an active user.");
      return v;
    }
    case "FILE":
      throw new ServiceError(400, "A file field cannot have a default value.");
    default:
  }
  const res = cleanValue(plainField(type, "Default value", options), v);
  if ("error" in res) throw new ServiceError(400, res.error);
  return res.value === null ? null : String(res.value);
}

const sectionOf = (layout: ModuleLayoutDto, id: string) => layout.sections.find(s => s.id === id);
const fieldOf = (layout: ModuleLayoutDto, key: string) => {
  const f = layout.fields.find(x => x.key === key);
  if (!f) throw new ServiceError(404, "That field does not exist.");
  return f;
};

// How many (not deleted) records have a value in the field, or this very option of it
function tableOf(def: ModuleDef, f: LayoutField) {
  return def.tables.find(t => t.section === f.section) ?? null;
}

// A project template is also the Work Type of Pre-Payment Records and the Task Template of items and quote lines: those count as uses of the template too
const isTemplateOption = (moduleId: ModuleId, f: LayoutField, optionId?: string) => moduleId === "project" && f.key === PROJECT_TEMPLATE_FIELD && optionId !== undefined;

export async function fieldUsage(moduleId: ModuleId, f: LayoutField, optionId?: string): Promise<number> {
  const own = await ownFieldUsage(moduleId, f, optionId);
  if (!isTemplateOption(moduleId, f, optionId)) return own;
  const [pprs, items, lines] = await Promise.all([
    prisma.prePayment.count({ where: { workTypeId: optionId, deletedAt: null } }),
    prisma.catalogItem.count({ where: { taskTemplateId: optionId, deletedAt: null } }),
    prisma.quoteItem.count({ where: { taskTemplateId: optionId, quote: { deletedAt: null } } }),
  ]);
  return own + pprs + items + lines;
}

async function ownFieldUsage(moduleId: ModuleId, f: LayoutField, optionId?: string): Promise<number> {
  const def = MODULES[moduleId];
  const table = tableOf(def, f);
  const parent = Prisma.raw(`"${def.table}"`);
  const key = f.key;
  // a table without a deletedAt column (Customers) has no removed records to leave out
  const alive = def.hardRecords ? Prisma.empty : Prisma.sql` AND "deletedAt" IS NULL`;
  if (f.type === "FILE") {
    const rows = await prisma.$queryRaw<{ n: number }[]>`SELECT count(DISTINCT "recordId")::int AS n FROM "ModuleFile" WHERE "module" = ${moduleId} AND "fieldKey" = ${key} AND "status" = 'READY' AND "deletedAt" IS NULL AND "recordId" IS NOT NULL`;
    return rows[0]?.n ?? 0;
  }
  if (f.isSystem) {
    // A real column
    const where = optionId === undefined ? { [key]: { not: null } } : { [key]: optionId };
    const delegate = (prisma as unknown as Record<string, { count(args: unknown): Promise<number> }>)[table ? table.model : def.model];
    return delegate.count({ where: table ? { ...where, [parentRelationOf(table)]: { deletedAt: null } } : def.hardRecords ? where : { ...where, deletedAt: null } });
  }
  // Stored in customFields. A Multi-select holds a list of option ids: it uses an option when the id is in that list.
  const several = f.type === "MULTISELECT";
  if (table) {
    const rowTable = Prisma.raw(`"${table.table}"`);
    const fk = Prisma.raw(`r."${parentKeyOf(table)}"`);
    const rows = optionId === undefined
      ? await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${rowTable} r JOIN ${parent} p ON p."id" = ${fk} WHERE p."deletedAt" IS NULL AND jsonb_exists(r."customFields", ${key}::text)`
      : several
        ? await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${rowTable} r JOIN ${parent} p ON p."id" = ${fk} WHERE p."deletedAt" IS NULL AND jsonb_typeof(r."customFields"->${key}::text) = 'array' AND jsonb_exists(r."customFields"->${key}::text, ${optionId}::text)`
        : await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${rowTable} r JOIN ${parent} p ON p."id" = ${fk} WHERE p."deletedAt" IS NULL AND r."customFields"->>${key}::text = ${optionId}`;
    return rows[0]?.n ?? 0;
  }
  const rows = optionId === undefined
    ? await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${parent} WHERE jsonb_exists("customFields", ${key}::text)${alive}`
    : several
      ? await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${parent} WHERE jsonb_typeof("customFields"->${key}::text) = 'array' AND jsonb_exists("customFields"->${key}::text, ${optionId}::text)${alive}`
      : await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ${parent} WHERE "customFields"->>${key}::text = ${optionId}${alive}`;
  return rows[0]?.n ?? 0;
}

// Removes a value (or one dropdown choice) from every record, soft-deleted ones too, so nothing is left pointing at it
async function clearValues(tx: Tx, moduleId: ModuleId, f: LayoutField, optionId?: string) {
  const def = MODULES[moduleId];
  const table = tableOf(def, f);
  const key = f.key;
  if (moduleId === "project" && key === "status" && optionId !== undefined) {
    // Project.status cannot be empty: the projects that had the removed status move to the first status that is left
    const next = f.options.find(o => o.id !== optionId)?.id ?? PROJECT_STATUS_DEFAULT;
    await tx.$executeRaw`UPDATE "Project" SET "status" = ${next} WHERE "status" = ${optionId}`;
    return;
  }
  if (isTemplateOption(moduleId, f, optionId)) {
    // the Work Type of Pre-Payment Records, the Task Template of items and quote lines and the Completed tick of the template go with it
    await tx.$executeRaw`UPDATE "PrePayment" SET "workTypeId" = NULL WHERE "workTypeId" = ${optionId}`;
    await tx.$executeRaw`UPDATE "CatalogItem" SET "taskTemplateId" = NULL WHERE "taskTemplateId" = ${optionId}`;
    await tx.$executeRaw`UPDATE "QuoteItem" SET "taskTemplateId" = NULL WHERE "taskTemplateId" = ${optionId}`;
    await tx.$executeRaw`DELETE FROM "ProjectWorkCoverage" WHERE "templateId" = ${optionId}`;
  }
  const target = Prisma.raw(`"${table ? table.table : def.table}"`);
  if (f.isSystem) {
    const column = Prisma.raw(`"${key}"`);
    if (optionId === undefined) await tx.$executeRaw`UPDATE ${target} SET ${column} = NULL`;
    else await tx.$executeRaw`UPDATE ${target} SET ${column} = NULL WHERE ${column} = ${optionId}`;
    return;
  }
  if (optionId === undefined) await tx.$executeRaw`UPDATE ${target} SET "customFields" = "customFields" - ${key}::text WHERE jsonb_exists("customFields", ${key}::text)`;
  else if (f.type === "MULTISELECT") {
    // the option leaves every list that has it; a list that is left empty is removed (a Multi-select is never stored as an empty list)
    await tx.$executeRaw`UPDATE ${target} t SET "customFields" = (
        SELECT CASE WHEN count(*) = 0 THEN t."customFields" - ${key}::text ELSE jsonb_set(t."customFields", ARRAY[${key}::text], jsonb_agg(e)) END
        FROM jsonb_array_elements(t."customFields"->${key}::text) AS e WHERE e <> to_jsonb(${optionId}::text)
      ) WHERE jsonb_typeof(t."customFields"->${key}::text) = 'array' AND jsonb_exists(t."customFields"->${key}::text, ${optionId}::text)`;
  } else await tx.$executeRaw`UPDATE ${target} SET "customFields" = "customFields" - ${key}::text WHERE "customFields"->>${key}::text = ${optionId}`;
}

// ---------------------------------------------------------------------------
// New Field / Edit Properties / Delete
// ---------------------------------------------------------------------------
export type NewFieldInput = {
  label: string; type: string; section?: string; required?: boolean; defaultValue?: string | null;
  options?: string[]; defaultOption?: number | null; currency?: string; maxFiles?: number; inList?: boolean; lookup?: string;
};

const cleanCurrency = (c: string | undefined) => {
  if (c === undefined) return undefined;
  if (!(CURRENCY_CODES as readonly string[]).includes(c)) throw new ServiceError(400, "Choose a currency from the list.");
  return c;
};
const cleanMaxFiles = (n: number | undefined) => {
  if (n === undefined) return undefined;
  if (!Number.isInteger(n) || n < 1 || n > 10) throw new ServiceError(400, "A file field can hold 1 to 10 files.");
  return n;
};

export async function createField(ctx: AuthContext, moduleId: ModuleId, input: NewFieldInput) {
  assertSuperAdmin(ctx);
  if (!CUSTOM_TYPE_SET.has(input.type)) throw new ServiceError(400, "Choose a field type from the list.");
  const type = input.type as CustomFieldType;
  if (type === "LOOKUP" && !MODULES[moduleId].allowLookupFields) throw new ServiceError(400, "Choose a field type from the list.");
  if (type === "MULTISELECT" && !MODULES[moduleId].allowMultiSelect) throw new ServiceError(400, "Choose a field type from the list.");
  const layout = await getLayout(moduleId);
  const sectionId = input.section ?? layout.sections.find(s => s.kind === "FORM")!.id;
  const section = sectionOf(layout, sectionId);
  if (!section) throw new ServiceError(400, "Choose a section from the list.");
  if (section.kind === "FIXED") throw new ServiceError(400, "Fields cannot be added to this section.");
  if (section.kind === "TABLE" && !TABLE_COLUMN_TYPES.has(type)) throw new ServiceError(400, "That field type cannot be a column of a table.");
  let lookup: LookupKind | undefined;
  if (type === "LOOKUP") {
    if (!input.lookup || !LOOKUP_TARGET_SET.has(input.lookup)) throw new ServiceError(400, "Choose which list the lookup shows.");
    lookup = input.lookup as LookupKind;
  } else if (input.lookup) {
    throw new ServiceError(400, "Only a lookup field has a list to show.");
  }
  if (layout.fields.filter(f => !f.isSystem).length >= MAX_CUSTOM_FIELDS) throw new ServiceError(400, `You can add up to ${MAX_CUSTOM_FIELDS} new fields.`);
  const label = cleanLabel(input.label, layout);

  let options: FieldOption[] = [];
  let defaultValue: string | null = null;
  if (type === "DROPDOWN" || type === "MULTISELECT") {
    options = newOptions(input.options ?? []);
    if (type === "MULTISELECT" && (input.defaultOption !== undefined && input.defaultOption !== null || input.defaultValue)) throw new ServiceError(400, "A multi-select field cannot have a default value.");
    if (input.defaultOption !== undefined && input.defaultOption !== null) {
      const chosen = options[input.defaultOption];
      if (!chosen) throw new ServiceError(400, "Default value must be one of the options in the list.");
      defaultValue = chosen.id;
    }
    if (input.required && options.length === 0) throw new ServiceError(400, `Add at least one option before making "${label}" required.`);
  } else {
    if (input.options?.length) throw new ServiceError(400, "Only a dropdown has options.");
    defaultValue = type === "LOOKUP" ? null : await cleanDefault(type, [], input.defaultValue);
  }
  const currency = type === "CURRENCY" ? cleanCurrency(input.currency) : undefined;
  const maxFiles = type === "FILE" ? cleanMaxFiles(input.maxFiles) : undefined;
  const field: StoredCustom = {
    key: newKey(), label, type, section: sectionId, required: !!input.required, enabled: true, defaultValue, options,
    ...(currency ? { currency } : {}), ...(maxFiles ? { maxFiles } : {}), ...(lookup ? { lookup } : {}),
  };
  const wantsColumn = !!input.inList && section.kind === "FORM" && type !== "FILE";

  const next = await saveLayout(ctx, moduleId, (s, current) => ({
    ...s,
    custom: [...(s.custom ?? []), field],
    order: [...current.fields.map(f => f.key), field.key],
    ...(wantsColumn ? { columns: [...current.columns, field.key] } : {}),
  }), { action: "MODULE_FIELD_CREATED", newValue: { key: field.key, label, type, section: sectionId, required: field.required, ...(type === "DROPDOWN" || type === "MULTISELECT" ? { options: options.map(o => o.label) } : {}) } });
  return { field: next.fields.find(f => f.key === field.key)!, layout: next };
}

export type FieldPatch = {
  label?: string; required?: boolean; enabled?: boolean; defaultValue?: string | null; section?: string; type?: string;
  currency?: string; maxFiles?: number; inList?: boolean;
};

export async function updateField(ctx: AuthContext, moduleId: ModuleId, key: string, patch: FieldPatch) {
  assertSuperAdmin(ctx);
  const layout = await getLayout(moduleId);
  const f = fieldOf(layout, key);
  const inTable = sectionOf(layout, f.section)?.kind !== "FORM"; // a column of a table, or a field of a fixed section: it stays where it is

  const change: StoredOverride = {};
  if (patch.label !== undefined) {
    const label = cleanLabel(patch.label, layout, key);
    if (label !== f.label) change.label = label;
  }
  if (patch.required !== undefined && patch.required !== f.required) {
    if (f.requiredLocked || f.type === "CALC") throw new ServiceError(400, "This property cannot be changed for this system field.");
    if (patch.required && (f.type === "DROPDOWN" || f.type === "MULTISELECT") && f.options.length === 0) throw new ServiceError(400, `Add at least one option before making "${f.label}" required.`);
    change.required = patch.required;
  }
  if (patch.enabled !== undefined && patch.enabled !== f.enabled) {
    if (f.requiredLocked && !patch.enabled) throw new ServiceError(400, `"${f.label}" is needed to save a record, so it cannot be hidden.`);
    change.enabled = patch.enabled;
  }
  if (patch.defaultValue !== undefined) {
    if (!f.defaultable && patch.defaultValue) throw new ServiceError(400, "This field cannot have a default value.");
    if (f.defaultable) change.defaultValue = await cleanDefault(f.type, f.options, patch.defaultValue);
  }
  if (patch.section !== undefined && patch.section !== f.section) {
    if (inTable) throw new ServiceError(400, "This field cannot move out of its section.");
    const target = sectionOf(layout, patch.section);
    if (!target || target.kind !== "FORM") throw new ServiceError(400, "Choose a section from the list.");
    change.section = patch.section;
  }
  let newType: CustomFieldType | undefined;
  if (patch.type !== undefined && patch.type !== f.type) {
    if (!f.typeChoices.includes(patch.type as FieldType)) throw new ServiceError(400, "The type of this field cannot be changed to that.");
    newType = patch.type as CustomFieldType;
  }
  if (patch.currency !== undefined) {
    if ((newType ?? f.type) !== "CURRENCY") throw new ServiceError(400, "Only an amount field has a currency.");
    const c = cleanCurrency(patch.currency)!;
    if (c !== f.currency) change.currency = c;
  }
  if (patch.maxFiles !== undefined) {
    if (f.type !== "FILE") throw new ServiceError(400, "Only a file field has a number of files.");
    const n = cleanMaxFiles(patch.maxFiles)!;
    if (n !== f.maxFiles) change.maxFiles = n;
  }
  let columns: string[] | undefined;
  if (patch.inList !== undefined && patch.inList !== f.inList) {
    if (patch.inList && (!f.listable || !(change.enabled ?? f.enabled))) throw new ServiceError(400, "This field cannot be a column of the list.");
    columns = patch.inList ? [...layout.columns, key] : layout.columns.filter(k => k !== key);
  }
  if (!Object.keys(change).length && !newType && columns === undefined) return layout;

  const before = { label: f.label, required: f.required, enabled: f.enabled, defaultValue: f.defaultValue, section: f.section, type: f.type, inList: f.inList };

  return saveLayout(ctx, moduleId, s => {
    const next: Stored = { ...s };
    if (f.isSystem) {
      const std = [...MODULES[moduleId].fields, ...MODULES[moduleId].tables.flatMap(t => t.fields)].find(x => x.key === key)!;
      const merged: StoredOverride = { ...(s.fields?.[key] ?? {}), ...change };
      if (merged.section === std.section) delete merged.section; // back where it started: nothing to remember
      next.fields = { ...(s.fields ?? {}), [key]: merged };
    } else {
      next.custom = (s.custom ?? []).map(c => (c.key === key ? ({ ...c, ...change, ...(newType ? { type: newType } : {}) } as StoredCustom) : c));
    }
    if (columns !== undefined) next.columns = columns;
    return next;
  }, {
    action: "MODULE_FIELD_UPDATED",
    oldValue: { key, ...before },
    newValue: JSON.parse(JSON.stringify({ key, ...change, ...(newType ? { type: newType } : {}), ...(columns !== undefined ? { inList: columns.includes(key) } : {}) })),
  });
}

// Only fields added with New Field can be deleted. If records have a value, the Super Admin must confirm first.
export async function deleteField(ctx: AuthContext, moduleId: ModuleId, key: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const layout = await getLayout(moduleId);
  const f = layout.fields.find(x => x.key === key);
  if (!f || f.isSystem) throw new ServiceError(404, "That field does not exist, or it is a standard field, which cannot be deleted.");
  const usage = await fieldUsage(moduleId, f);
  if (usage > 0 && !confirm) {
    throw new LayoutInUseError(usage, `${usage} ${usage === 1 ? "record has" : "records have"} a value for "${f.label}". Confirm to delete the field and those values.`);
  }
  let orphans: string[] = [];
  const next = await saveLayout(ctx, moduleId, s => ({
    ...s,
    custom: (s.custom ?? []).filter(c => c.key !== key),
    ...(s.order ? { order: s.order.filter(k => k !== key) } : {}),
    ...(s.columns ? { columns: s.columns.filter(k => k !== key) } : {}),
  }), { action: "MODULE_FIELD_DELETED", oldValue: { key, label: f.label, type: f.type, recordsWithValue: usage } }, async tx => {
    if (f.type === "FILE") {
      const files = await tx.moduleFile.findMany({ where: { module: moduleId, fieldKey: key, deletedAt: null }, select: { id: true, storagePath: true } });
      orphans = files.map(x => x.storagePath);
      await tx.moduleFile.updateMany({ where: { id: { in: files.map(x => x.id) } }, data: { deletedAt: new Date() } });
    } else {
      await clearValues(tx, moduleId, f);
    }
  });
  await removeObjects(orphans);
  return { deleted: true, usage, layout: next };
}

export class LayoutInUseError extends Error {
  constructor(public usage: number, message: string) {
    super(message);
  }
}

// Reorders the fields of one section; the other sections keep their places
export async function reorderFields(ctx: AuthContext, moduleId: ModuleId, sectionId: string, orderedKeys: string[]) {
  const layout = await getLayout(moduleId);
  if (!sectionOf(layout, sectionId)) throw new ServiceError(404, "That section does not exist.");
  const inSection = layout.fields.filter(f => f.section === sectionId).map(f => f.key);
  if (new Set(orderedKeys).size !== orderedKeys.length || orderedKeys.length !== inSection.length || !orderedKeys.every(k => inSection.includes(k))) {
    throw new ServiceError(400, "The new order must list every field of the section exactly once.");
  }
  return saveLayout(ctx, moduleId, (s, current) => {
    const slots = current.fields.map((f, i) => (f.section === sectionId ? i : -1)).filter(i => i >= 0);
    const keys = current.fields.map(f => f.key);
    slots.forEach((slot, i) => { keys[slot] = orderedKeys[i]; });
    return { ...s, order: keys };
  }, { action: "MODULE_FIELDS_REORDERED", newValue: { section: sectionId, order: orderedKeys } });
}

// The order of the list page's columns: exactly the fields that are columns now
export async function setColumns(ctx: AuthContext, moduleId: ModuleId, orderedKeys: string[]) {
  const layout = await getLayout(moduleId);
  if (new Set(orderedKeys).size !== orderedKeys.length || orderedKeys.length !== layout.columns.length || !orderedKeys.every(k => layout.columns.includes(k))) {
    throw new ServiceError(400, "The new order must list every column exactly once.");
  }
  return saveLayout(ctx, moduleId, s => ({ ...s, columns: orderedKeys }), { action: "MODULE_COLUMNS_REORDERED", newValue: { order: orderedKeys } });
}

// ---------------------------------------------------------------------------
// The choices of a dropdown (standard or added with New Field)
// ---------------------------------------------------------------------------
async function dropdown(moduleId: ModuleId, key: string) {
  const layout = await getLayout(moduleId);
  const f = fieldOf(layout, key);
  if (f.type !== "DROPDOWN" && f.type !== "MULTISELECT") throw new ServiceError(400, `"${f.label}" has no list of options (it is not a dropdown or a multi-select).`);
  return { layout, f };
}

function withOptions(s: Stored, f: LayoutField, options: FieldOption[], defaultValue?: string | null): Stored {
  if (f.isSystem) {
    const merged: StoredOverride = { ...(s.fields?.[f.key] ?? {}), options, ...(defaultValue !== undefined ? { defaultValue } : {}) };
    return { ...s, fields: { ...(s.fields ?? {}), [f.key]: merged } };
  }
  return { ...s, custom: (s.custom ?? []).map(c => (c.key === f.key ? { ...c, options, ...(defaultValue !== undefined ? { defaultValue } : {}) } : c)) };
}

export async function listFieldOptions(ctx: AuthContext, moduleId: ModuleId, key: string) {
  assertSuperAdmin(ctx);
  const { f } = await dropdown(moduleId, key);
  const usage = await Promise.all(f.options.map(o => fieldUsage(moduleId, f, o.id)));
  return f.options.map((o, i) => ({ id: o.id, name: o.label, usage: usage[i] }));
}

export async function addFieldOption(ctx: AuthContext, moduleId: ModuleId, key: string, rawName: string) {
  assertSuperAdmin(ctx);
  const { f } = await dropdown(moduleId, key);
  if (f.options.length >= MAX_OPTIONS) throw new ServiceError(400, `A list can have up to ${MAX_OPTIONS} options.`);
  const name = cleanOptionName(rawName, f.options);
  const option = { id: newOptionId(), label: name };
  await saveLayout(ctx, moduleId, s => withOptions(s, f, [...f.options, option]), {
    action: "DROPDOWN_OPTION_CREATED", newValue: { field: key, id: option.id, label: name },
  });
  return { id: option.id, name };
}

export async function renameFieldOption(ctx: AuthContext, moduleId: ModuleId, key: string, optionId: string, rawName: string) {
  assertSuperAdmin(ctx);
  const { f } = await dropdown(moduleId, key);
  const option = f.options.find(o => o.id === optionId);
  if (!option) throw new ServiceError(404, "That option does not exist.");
  const name = cleanOptionName(rawName, f.options, optionId);
  if (name === option.label) return;
  await saveLayout(ctx, moduleId, s => withOptions(s, f, f.options.map(o => (o.id === optionId ? { ...o, label: name } : o))), {
    action: "DROPDOWN_OPTION_UPDATED", oldValue: { field: key, id: optionId, label: option.label }, newValue: { field: key, id: optionId, label: name },
  });
}

// An option that records use is only removed after the Super Admin confirmed it; their value for the field is cleared
export async function deleteFieldOption(ctx: AuthContext, moduleId: ModuleId, key: string, optionId: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const { f } = await dropdown(moduleId, key);
  const option = f.options.find(o => o.id === optionId);
  if (!option) throw new ServiceError(404, "That option does not exist.");
  if (f.required && f.options.length <= 1) {
    throw new ServiceError(400, `"${f.label}" is required, so it needs at least one option. Make it optional first, or add another option before deleting this one.`);
  }
  const usage = await fieldUsage(moduleId, f, optionId);
  if (usage > 0 && !confirm) {
    throw new LayoutInUseError(usage, `${usage} ${usage === 1 ? "record uses" : "records use"} "${option.label}". Confirm to remove it from them.`);
  }
  await saveLayout(ctx, moduleId, s => withOptions(s, f, f.options.filter(o => o.id !== optionId), f.defaultValue === optionId ? null : undefined), {
    action: "DROPDOWN_OPTION_DELETED", oldValue: { field: key, id: optionId, label: option.label, recordsUsingIt: usage },
  }, usage > 0 ? tx => clearValues(tx, moduleId, f, optionId) : undefined);
  return { deleted: true, usage };
}

export async function reorderFieldOptions(ctx: AuthContext, moduleId: ModuleId, key: string, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  const { f } = await dropdown(moduleId, key);
  const ids = f.options.map(o => o.id);
  if (new Set(orderedIds).size !== orderedIds.length || orderedIds.length !== ids.length || !orderedIds.every(id => ids.includes(id))) {
    throw new ServiceError(400, "The new order must list every option exactly once.");
  }
  await saveLayout(ctx, moduleId, s => withOptions(s, f, orderedIds.map(id => f.options.find(o => o.id === id)!)), {
    action: "DROPDOWN_OPTIONS_REORDERED", newValue: { field: key, order: orderedIds },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
function cleanSectionLabel(raw: string, layout: ModuleLayoutDto, exceptId?: string) {
  const label = tidy(raw);
  if (!label) throw new ServiceError(400, "Section name is required.");
  if (label.length > SECTION_LABEL_MAX) throw new ServiceError(400, `Section name must be ${SECTION_LABEL_MAX} characters or fewer.`);
  if (layout.sections.some(s => s.id !== exceptId && s.label.toLowerCase() === label.toLowerCase())) throw new ServiceError(409, `There is already a section called "${label}".`);
  return label;
}

// Every section, in order, as stored entries (so a new one can be put in the right place)
function materializeSections(layout: ModuleLayoutDto): StoredSection[] {
  return layout.sections.map(s => (s.isSystem ? { id: s.id, label: s.label } : { id: s.id, label: s.label, custom: true }));
}

export async function createSection(ctx: AuthContext, moduleId: ModuleId, rawLabel: string) {
  assertSuperAdmin(ctx);
  const layout = await getLayout(moduleId);
  if (layout.sections.filter(s => !s.isSystem).length >= MAX_CUSTOM_SECTIONS) throw new ServiceError(400, `You can add up to ${MAX_CUSTOM_SECTIONS} sections.`);
  const label = cleanSectionLabel(rawLabel, layout);
  const entry: StoredSection = { id: newSectionId(), label, custom: true };
  return saveLayout(ctx, moduleId, (s, current) => {
    const all = materializeSections(current);
    let at = current.sections.findIndex(x => x.kind !== "FORM");
    if (at < 0) at = current.sections.length;
    all.splice(at, 0, entry); // after the form sections that come first, before the first table or fixed section
    return { ...s, sections: all };
  }, { action: "MODULE_SECTION_CREATED", newValue: { id: entry.id, label } });
}

export async function renameSection(ctx: AuthContext, moduleId: ModuleId, id: string, rawLabel: string) {
  assertSuperAdmin(ctx);
  const layout = await getLayout(moduleId);
  const section = sectionOf(layout, id);
  if (!section) throw new ServiceError(404, "That section does not exist.");
  const label = cleanSectionLabel(rawLabel, layout, id);
  if (label === section.label) return layout;
  return saveLayout(ctx, moduleId, (s, current) => ({
    ...s,
    sections: materializeSections(current).map(x => (x.id === id ? { ...x, label } : x)),
  }), { action: "MODULE_SECTION_UPDATED", oldValue: { id, label: section.label }, newValue: { id, label } });
}

// Fields of a deleted section move to the first section of the form: nothing is lost
export async function deleteSection(ctx: AuthContext, moduleId: ModuleId, id: string) {
  assertSuperAdmin(ctx);
  const layout = await getLayout(moduleId);
  const section = sectionOf(layout, id);
  if (!section || section.isSystem) throw new ServiceError(404, "That section does not exist, or it is a standard section, which cannot be deleted.");
  const first = layout.sections.find(s => s.kind === "FORM" && s.id !== id)!.id;
  const moved = layout.fields.filter(f => f.section === id);
  const next = await saveLayout(ctx, moduleId, (s, current) => ({
    ...s,
    sections: materializeSections(current).filter(x => x.id !== id),
    custom: (s.custom ?? []).map(c => (c.section === id ? { ...c, section: first } : c)),
    fields: Object.fromEntries(Object.entries(s.fields ?? {}).map(([k, o]) => [k, o.section === id ? { ...o, section: first } : o])),
  }), { action: "MODULE_SECTION_DELETED", oldValue: { id, label: section.label, fieldsMoved: moved.map(f => f.key) } });
  return { deleted: true, moved: moved.length, layout: next };
}

export async function reorderSections(ctx: AuthContext, moduleId: ModuleId, orderedIds: string[]) {
  const layout = await getLayout(moduleId);
  const ids = layout.sections.map(s => s.id);
  if (new Set(orderedIds).size !== orderedIds.length || orderedIds.length !== ids.length || !orderedIds.every(i => ids.includes(i))) {
    throw new ServiceError(400, "The new order must list every section exactly once.");
  }
  return saveLayout(ctx, moduleId, (s, current) => {
    const all = materializeSections(current);
    return { ...s, sections: orderedIds.map(i => all.find(x => x.id === i)!) };
  }, { action: "MODULE_SECTIONS_REORDERED", newValue: { order: orderedIds } });
}
