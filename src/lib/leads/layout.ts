import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "@/lib/users/service";
import { CONVENTIONAL_RATES } from "./constants";
import { isHttpUrl, normalizePhone } from "./format";
import {
  CUSTOM_TYPE_SET,
  FIELD_LABEL_MAX,
  MAX_CUSTOM_FIELDS,
  OPTION_LABEL_MAX,
  SYSTEM_FIELDS,
  customOptionType,
  type FieldType,
  type LeadFieldDto,
} from "./layout-shared";

type Tx = Prisma.TransactionClient;

export function assertSuperAdmin(ctx: AuthContext) {
  if (!ctx.isSuperAdmin) throw new ServiceError(403, "Only a Super Admin can edit the page layout.");
}

// Thrown when an action would change existing leads and the caller has not confirmed it yet.
// The API turns it into a 409 that carries the number of leads, so the screen can warn first.
export class LayoutInUseError extends Error {
  constructor(public action: "delete-option" | "delete-field", public usage: number, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------
// The original form fields live in the LeadField table too, so they can be renamed / made required.
// Any that are missing are created (existing rows are never touched), so the layout always has all of them.
async function createMissingSystemFields(have: Set<string>) {
  const missing = SYSTEM_FIELDS.map((d, i) => ({ d, i })).filter(({ d }) => !have.has(d.key));
  if (!missing.length) return;
  await prisma.leadField.createMany({
    skipDuplicates: true,
    data: missing.map(({ d, i }) => ({
      key: d.key,
      label: d.label,
      fieldType: d.type,
      isSystem: true,
      required: d.required,
      requiredLocked: !!d.requiredLocked,
      optionType: d.optionType ?? null,
      sortOrder: i * 10,
    })),
  });
}

type FieldRow = Prisma.LeadFieldGetPayload<object>;

function toDto(f: FieldRow): LeadFieldDto {
  const def = f.isSystem ? SYSTEM_FIELDS.find(d => d.key === f.key) : undefined;
  return {
    id: f.id,
    key: f.key,
    label: f.label,
    type: (def ? def.type : f.fieldType) as FieldType,
    isSystem: f.isSystem,
    required: f.required,
    requiredLocked: f.requiredLocked,
    defaultValue: f.defaultValue,
    defaultable: def ? !!def.defaultable : f.fieldType !== "FILE",
    optionType: f.optionType,
    parentOptionType: def?.parentOptionType ?? null,
    sortOrder: f.sortOrder,
  };
}

const loadFields = () => prisma.leadField.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

export async function getLayout(): Promise<LeadFieldDto[]> {
  let rows = await loadFields();
  const have = new Set(rows.filter(r => r.isSystem).map(r => r.key));
  if (SYSTEM_FIELDS.some(d => !have.has(d.key))) {
    await createMissingSystemFields(have);
    rows = await loadFields();
  }
  // Fields that are no longer part of the form (e.g. the old Requirements pick list) stay in the table but are not shown or enforced
  const known = new Set(SYSTEM_FIELDS.map(d => d.key));
  return rows.filter(r => !r.isSystem || known.has(r.key)).map(toDto);
}

function cleanLabel(raw: string, max: number, what: string) {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!label) throw new ServiceError(400, `${what} is required.`);
  if (label.length > max) throw new ServiceError(400, `${what} must be ${max} characters or fewer.`);
  return label;
}

async function assertFieldLabelFree(db: Tx | typeof prisma, label: string, exceptId?: string) {
  const clash = await db.leadField.findFirst({
    where: { label: { equals: label, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ServiceError(409, `Another field is already called "${label}".`);
}

// Checks a default value for a field type; returns the text to store (null = no default)
async function cleanDefault(field: { type: FieldType; optionType: string | null }, raw: string | null | undefined): Promise<string | null> {
  const v = (raw ?? "").trim();
  if (!v) return null;
  switch (field.type) {
    case "TEXT": if (v.length > 500) throw new ServiceError(400, "Default value is too long."); return v;
    case "TEXTAREA": if (v.length > 5000) throw new ServiceError(400, "Default value is too long."); return v;
    case "NUMBER": {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw new ServiceError(400, "Default value must be a number (0 or more).");
      return String(n);
    }
    case "RATE": if (!CONVENTIONAL_RATES.includes(Number(v))) throw new ServiceError(400, "Default value must be one of 0, 10, … 100."); return String(Number(v));
    case "DATE": if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new ServiceError(400, "Default value must be a valid date."); return v;
    case "EMAIL": if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 200) throw new ServiceError(400, "Default value must be a valid email address."); return v;
    case "PHONE": if (normalizePhone(v) === null) throw new ServiceError(400, "Default value must be a valid phone number."); return v;
    case "URL": if (!isHttpUrl(v)) throw new ServiceError(400, "Default value must be a valid http(s) link."); return v;
    case "CHECKBOX": if (v !== "true" && v !== "false") throw new ServiceError(400, "Default value must be Yes or No."); return v;
    case "DROPDOWN": {
      const opt = await prisma.leadOption.findFirst({ where: { id: v, type: field.optionType ?? "" }, select: { id: true } });
      if (!opt) throw new ServiceError(400, "Default value must be one of the options in the list.");
      return v;
    }
    default:
      throw new ServiceError(400, "This field cannot have a default value.");
  }
}

export async function createField(ctx: AuthContext, input: { label: string; type: string; required?: boolean; defaultValue?: string | null }) {
  assertSuperAdmin(ctx);
  if (!CUSTOM_TYPE_SET.has(input.type)) throw new ServiceError(400, "Choose a valid field type.");
  const type = input.type as FieldType;
  const label = cleanLabel(input.label, FIELD_LABEL_MAX, "Field label");
  await getLayout(); // makes sure the system fields exist before ordering a new one after them

  const customCount = await prisma.leadField.count({ where: { isSystem: false } });
  if (customCount >= MAX_CUSTOM_FIELDS) throw new ServiceError(400, `You can add up to ${MAX_CUSTOM_FIELDS} custom fields.`);
  await assertFieldLabelFree(prisma, label);

  const key = `cf_${randomBytes(5).toString("hex")}`;
  const optionType = type === "DROPDOWN" ? customOptionType(key) : null;
  if (type === "DROPDOWN" && input.defaultValue) throw new ServiceError(400, "Add options first, then pick a default.");
  const defaultValue = await cleanDefault({ type, optionType }, input.defaultValue);

  const last = await prisma.leadField.aggregate({ _max: { sortOrder: true } });
  const row = await prisma.$transaction(async tx => {
    const created = await tx.leadField.create({
      data: { key, label, fieldType: type, isSystem: false, required: !!input.required, optionType, defaultValue, sortOrder: (last._max.sortOrder ?? 0) + 10 },
    });
    await writeAudit({ action: "LEAD_FIELD_CREATED", actorUserId: ctx.userId, metadata: { fieldId: created.id, key, label, type } }, tx);
    return created;
  });
  return toDto(row);
}

export async function updateField(ctx: AuthContext, id: string, input: { label?: string; required?: boolean; defaultValue?: string | null }) {
  assertSuperAdmin(ctx);
  const current = await prisma.leadField.findUnique({ where: { id } });
  if (!current) throw new ServiceError(404, "Field not found.");
  const dto = toDto(current);

  const data: Prisma.LeadFieldUpdateInput = {};
  if (input.label !== undefined) {
    const label = cleanLabel(input.label, FIELD_LABEL_MAX, "Field label");
    if (label !== current.label) {
      await assertFieldLabelFree(prisma, label, id);
      data.label = label;
    }
  }
  if (input.required !== undefined && input.required !== current.required) {
    if (current.requiredLocked) throw new ServiceError(400, "This property cannot be changed for this system field.");
    data.required = input.required;
  }
  if (input.defaultValue !== undefined) {
    if (!dto.defaultable && input.defaultValue) throw new ServiceError(400, "This field cannot have a default value.");
    data.defaultValue = dto.defaultable ? await cleanDefault({ type: dto.type, optionType: dto.optionType }, input.defaultValue) : null;
  }
  if (!Object.keys(data).length) return dto;

  const row = await prisma.$transaction(async tx => {
    const updated = await tx.leadField.update({ where: { id }, data });
    await writeAudit(
      {
        action: "LEAD_FIELD_UPDATED",
        actorUserId: ctx.userId,
        oldValue: { label: current.label, required: current.required, defaultValue: current.defaultValue },
        newValue: { label: updated.label, required: updated.required, defaultValue: updated.defaultValue },
        metadata: { fieldId: id, key: current.key },
      },
      tx,
    );
    return updated;
  });
  return toDto(row);
}

async function customUsage(key: string, optionId?: string): Promise<number> {
  const rows = optionId
    ? await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Lead" WHERE "deletedAt" IS NULL AND "customFields"->>${key} = ${optionId}`
    : await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Lead" WHERE "deletedAt" IS NULL AND jsonb_exists("customFields", ${key})`;
  return Number(rows[0]?.n ?? 0);
}

export async function deleteField(ctx: AuthContext, id: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const field = await prisma.leadField.findUnique({ where: { id } });
  if (!field) throw new ServiceError(404, "Field not found.");
  if (field.isSystem) throw new ServiceError(400, "System fields cannot be deleted.");

  const usage = await customUsage(field.key);
  if (usage > 0 && !confirm) {
    throw new LayoutInUseError("delete-field", usage, `"${field.label}" has a value on ${usage} lead${usage === 1 ? "" : "s"}. Deleting the field removes those values.`);
  }
  await prisma.$transaction(async tx => {
    // Take the field's values out of every lead, then the field and its options
    await tx.$executeRaw`UPDATE "Lead" SET "customFields" = "customFields" - ${field.key} WHERE jsonb_exists("customFields", ${field.key})`;
    if (field.optionType) await tx.leadOption.deleteMany({ where: { type: field.optionType } });
    await tx.leadField.delete({ where: { id } });
    await writeAudit({ action: "LEAD_FIELD_DELETED", actorUserId: ctx.userId, metadata: { fieldId: id, key: field.key, label: field.label, leadsWithValue: usage } }, tx);
  });
  return { deleted: true, usage };
}

export async function reorderCustomFields(ctx: AuthContext, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  if (new Set(orderedIds).size !== orderedIds.length) throw new ServiceError(400, "Duplicate fields in the new order.");
  const rows = await prisma.leadField.findMany({ where: { id: { in: orderedIds }, isSystem: false }, select: { id: true, sortOrder: true } });
  if (rows.length !== orderedIds.length) throw new ServiceError(400, "Only custom fields can be reordered.");
  const slots = rows.map(r => r.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(async tx => {
    for (let i = 0; i < orderedIds.length; i++) await tx.leadField.update({ where: { id: orderedIds[i] }, data: { sortOrder: slots[i] } });
    await writeAudit({ action: "LEAD_FIELDS_REORDERED", actorUserId: ctx.userId, metadata: { count: orderedIds.length } }, tx);
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pick-list options (system lists and custom pick-list fields)
// ---------------------------------------------------------------------------
export type OptionDto = { id: string; label: string; parentId: string | null; sortOrder: number; usage?: number };

// Lead column that links to the option row, for each system list
const REFERENCE_FIELDS = {
  SOURCE: "sourceId",
  MODE_OF_CUSTOMER: "modeOfCustomerId",
  PRODUCT_OR_SERVICE: "productOrServiceId",
  REQUIREMENT: "requirementId",
  MAIN_CATEGORY: "mainCategoryId",
  CATEGORY: "categoryId",
  SUBCATEGORY: "subcategoryId",
  LEAD_STATUS: "leadStatusId",
  LEAD_TYPE: "leadTypeId",
} as const satisfies Record<string, keyof Prisma.LeadWhereInput>;
type ReferenceField = (typeof REFERENCE_FIELDS)[keyof typeof REFERENCE_FIELDS];

async function pickListField(fieldId: string) {
  const field = await prisma.leadField.findUnique({ where: { id: fieldId } });
  if (!field || field.fieldType !== "DROPDOWN" || !field.optionType) throw new ServiceError(404, "This field has no options to edit.");
  return { field, optionType: field.optionType, parentType: toDto(field).parentOptionType };
}

async function countOptionUsage(optionType: string, fieldKey: string, optionId: string): Promise<number> {
  const ref = (REFERENCE_FIELDS as Record<string, ReferenceField>)[optionType];
  if (ref) return prisma.lead.count({ where: { [ref]: optionId, deletedAt: null } });
  return customUsage(fieldKey, optionId);
}

const optionSelect = { id: true, label: true, parentId: true, sortOrder: true } as const;

// Any signed-in user can read; usage counts are for the editor (Super Admin)
export async function getFieldOptions(fieldId: string, withUsage: boolean): Promise<OptionDto[]> {
  const { field, optionType } = await pickListField(fieldId);
  const options = await prisma.leadOption.findMany({ where: { type: optionType }, orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: optionSelect });
  if (!withUsage) return options;
  const usage = await Promise.all(options.map(o => countOptionUsage(optionType, field.key, o.id)));
  return options.map((o, i) => ({ ...o, usage: usage[i] }));
}

async function assertOptionLabelFree(tx: Tx, type: string, parentId: string | null, label: string, exceptId?: string) {
  const clash = await tx.leadOption.findFirst({
    where: { type, parentId, label: { equals: label, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ServiceError(409, `"${label}" is already in this list.`);
}

export async function createOption(ctx: AuthContext, fieldId: string, input: { label: string; parentId?: string | null }) {
  assertSuperAdmin(ctx);
  const { optionType, parentType, field } = await pickListField(fieldId);
  const label = cleanLabel(input.label, OPTION_LABEL_MAX, "Option label");

  let parentId: string | null = null;
  if (parentType) {
    if (!input.parentId) throw new ServiceError(400, "Choose which option this one belongs to.");
    const parent = await prisma.leadOption.findFirst({ where: { id: input.parentId, type: parentType }, select: { id: true } });
    if (!parent) throw new ServiceError(400, "The selected parent option does not exist.");
    parentId = parent.id;
  } else if (input.parentId) {
    throw new ServiceError(400, "This list has no levels.");
  }

  return prisma.$transaction(async tx => {
    await assertOptionLabelFree(tx, optionType, parentId, label);
    const last = await tx.leadOption.aggregate({ where: { type: optionType }, _max: { sortOrder: true } });
    const created = await tx.leadOption.create({ data: { type: optionType, label, parentId, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: optionSelect });
    await writeAudit({ action: "DROPDOWN_OPTION_CREATED", actorUserId: ctx.userId, metadata: { field: field.key, optionId: created.id, label } }, tx);
    return created;
  });
}

async function optionWithField(optionId: string) {
  const option = await prisma.leadOption.findUnique({ where: { id: optionId }, select: { id: true, type: true, label: true, parentId: true } });
  if (!option) throw new ServiceError(404, "Option not found.");
  const field = await prisma.leadField.findFirst({ where: { optionType: option.type }, select: { id: true, key: true } });
  if (!field) throw new ServiceError(404, "Option not found.");
  return { option, field };
}

export async function renameOption(ctx: AuthContext, optionId: string, rawLabel: string) {
  assertSuperAdmin(ctx);
  const { option, field } = await optionWithField(optionId);
  const label = cleanLabel(rawLabel, OPTION_LABEL_MAX, "Option label");
  if (label === option.label) return { id: option.id, label };
  return prisma.$transaction(async tx => {
    await assertOptionLabelFree(tx, option.type, option.parentId, label, optionId);
    // Leads link to the option (not to its text), so renaming never changes a lead
    const updated = await tx.leadOption.update({ where: { id: optionId }, data: { label }, select: { id: true, label: true } });
    await writeAudit({ action: "DROPDOWN_OPTION_UPDATED", actorUserId: ctx.userId, oldValue: { label: option.label }, newValue: { label }, metadata: { field: field.key, optionId } }, tx);
    return updated;
  });
}

export async function deleteOption(ctx: AuthContext, optionId: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const { option, field } = await optionWithField(optionId);

  // A level that still has options below it cannot go: those would be left without a parent
  const children = await prisma.leadOption.count({ where: { parentId: optionId } });
  if (children > 0) throw new ServiceError(409, `"${option.label}" still has ${children} option${children === 1 ? "" : "s"} under it. Delete or move those first.`);

  const usage = await countOptionUsage(option.type, field.key, optionId);
  if (usage > 0 && !confirm) {
    throw new LayoutInUseError("delete-option", usage, "This option is currently being used by existing records. Deleting it may affect existing data. Are you sure you want to continue?");
  }

  return prisma.$transaction(async tx => {
    let cleared: string[] = [];
    if (usage > 0) {
      // Leads only hold a link to the option, so clear exactly that one field and write down which leads it was
      const ref = (REFERENCE_FIELDS as Record<string, ReferenceField>)[option.type];
      if (ref) {
        const affected = await tx.lead.findMany({ where: { [ref]: optionId }, select: { id: true, leadCode: true } });
        await tx.lead.updateMany({ where: { [ref]: optionId }, data: { [ref]: null } });
        cleared = affected.map(l => l.leadCode ?? l.id);
      } else {
        const affected = await tx.$queryRaw<{ id: string; leadCode: string | null }[]>`SELECT "id", "leadCode" FROM "Lead" WHERE "customFields"->>${field.key} = ${optionId}`;
        await tx.$executeRaw`UPDATE "Lead" SET "customFields" = "customFields" - ${field.key} WHERE "customFields"->>${field.key} = ${optionId}`;
        cleared = affected.map(l => l.leadCode ?? l.id);
      }
    }
    // If this option was the field's default value, the default goes with it
    await tx.leadField.updateMany({ where: { optionType: option.type, defaultValue: optionId }, data: { defaultValue: null } });
    await tx.leadOption.delete({ where: { id: optionId } });
    await writeAudit(
      {
        action: "DROPDOWN_OPTION_DELETED",
        actorUserId: ctx.userId,
        oldValue: { label: option.label },
        metadata: { field: field.key, optionId, leadsUsingIt: usage, leadsFieldCleared: cleared.slice(0, 500), leadsFieldClearedCount: cleared.length },
      },
      tx,
    );
    return { deleted: true, usage };
  });
}

export async function reorderOptions(ctx: AuthContext, fieldId: string, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  const { optionType, field } = await pickListField(fieldId);
  if (new Set(orderedIds).size !== orderedIds.length) throw new ServiceError(400, "Duplicate options in the new order.");
  const rows = await prisma.leadOption.findMany({ where: { id: { in: orderedIds }, type: optionType }, select: { id: true, sortOrder: true } });
  if (rows.length !== orderedIds.length) throw new ServiceError(400, "The new order contains options that are not in this list.");
  // Re-use the same position numbers so options not included in this call keep their places
  const slots = rows.map(r => r.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(async tx => {
    for (let i = 0; i < orderedIds.length; i++) await tx.leadOption.update({ where: { id: orderedIds[i] }, data: { sortOrder: slots[i] } });
    await writeAudit({ action: "DROPDOWN_OPTIONS_REORDERED", actorUserId: ctx.userId, metadata: { field: field.key, count: orderedIds.length } }, tx);
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Used when a lead is saved: required fields and custom values
// ---------------------------------------------------------------------------
const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

function issue(path: (string | number)[], message: string): ZodIssue {
  return { code: "custom", path, message };
}

export type CustomValues = Record<string, string | number | boolean>;

// Throws a ZodError (same shape the form already understands) when something is missing or invalid.
// Returns the custom values to store, trimmed and typed.
export async function checkLeadAgainstLayout(input: Record<string, unknown> & { customFields?: Record<string, unknown> }): Promise<CustomValues> {
  const fields = await getLayout();
  const issues: ZodIssue[] = [];

  for (const f of fields) {
    if (!f.isSystem || !f.required || f.requiredLocked) continue;
    if (isEmpty(input[f.key])) issues.push(issue([f.key], `${f.label} is required`));
  }

  const custom = fields.filter(f => !f.isSystem);
  const byKey = new Map(custom.map(f => [f.key, f]));
  const given = input.customFields ?? {};
  for (const key of Object.keys(given)) if (!byKey.has(key)) issues.push(issue(["customFields", key], "Unknown field"));

  // Pick-list values must be real options of that field
  const optionIds = custom.filter(f => f.type === "DROPDOWN").map(f => given[f.key]).filter((v): v is string => typeof v === "string" && v !== "");
  const options = optionIds.length ? await prisma.leadOption.findMany({ where: { id: { in: optionIds } }, select: { id: true, type: true } }) : [];
  const optionType = new Map(options.map(o => [o.id, o.type]));

  const out: CustomValues = {};
  for (const f of custom) {
    const raw = given[f.key];
    const path = ["customFields", f.key];
    if (f.type === "CHECKBOX") {
      if (raw !== undefined && raw !== null && typeof raw !== "boolean") { issues.push(issue(path, `${f.label} must be Yes or No`)); continue; }
      if (raw === true) out[f.key] = true;
      else if (f.required) issues.push(issue(path, `${f.label} is required`));
      continue;
    }
    if (isEmpty(raw)) {
      if (f.required) issues.push(issue(path, `${f.label} is required`));
      continue;
    }
    switch (f.type) {
      case "TEXT": case "TEXTAREA": {
        const s = String(raw).trim();
        if (typeof raw !== "string" || s.length > (f.type === "TEXT" ? 500 : 5000)) issues.push(issue(path, `${f.label} is too long`));
        else out[f.key] = s;
        break;
      }
      case "NUMBER": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(n) || Math.abs(n) > 1e12) issues.push(issue(path, `${f.label} must be a number`));
        else out[f.key] = n;
        break;
      }
      case "DATE": {
        const s = String(raw);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) issues.push(issue(path, `${f.label} must be a valid date`));
        else out[f.key] = s;
        break;
      }
      case "EMAIL": {
        const s = String(raw).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 200) issues.push(issue(path, `${f.label} must be a valid email address`));
        else out[f.key] = s;
        break;
      }
      case "PHONE": {
        const s = String(raw).trim();
        if (normalizePhone(s) === null) issues.push(issue(path, `${f.label} must be a valid phone number (7–15 digits)`));
        else out[f.key] = s;
        break;
      }
      case "URL": {
        const s = String(raw).trim();
        if (!isHttpUrl(s) || s.length > 2000) issues.push(issue(path, `${f.label} must be a valid http(s) link`));
        else out[f.key] = s;
        break;
      }
      case "DROPDOWN": {
        const id = String(raw);
        if (optionType.get(id) !== f.optionType) issues.push(issue(path, `${f.label} is not a valid choice`));
        else out[f.key] = id;
        break;
      }
      default:
        issues.push(issue(path, `${f.label} cannot be set`));
    }
  }

  if (issues.length) throw new ZodError(issues);
  return out;
}
