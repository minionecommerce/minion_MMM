import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "./service";
import {
  assertSuperAdmin,
  buildLayout,
  cleanCustomDefault,
  cleanFieldLabel,
  getUserLayout,
  mutateStored,
  readCustom,
  readStored,
  saveStored,
  type Stored,
  type StoredCustom,
} from "./layout";
import { CUSTOM_TYPE_SET, MAX_CUSTOM_USER_FIELDS, USER_OPTION_LABEL_MAX, cleanFieldValue, type FieldOption, type FieldValue, type UserFieldType } from "./layout-shared";

// Fields added in Users → Edit Page Layout → New Field. Their definition (label, type, options, ...) is part of the
// layout setting; the value of each field is stored per employee in Employee.customFields under the field's key.
const MAX_OPTIONS = 200;
const newKey = () => `cf_${randomBytes(5).toString("hex")}`;
const newOptionId = () => `o_${randomBytes(5).toString("hex")}`;

// How many (active) people have a value for the field, or this very option of it
async function usageOf(key: string, optionId?: string): Promise<number> {
  const rows = optionId === undefined
    ? await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "Employee" e JOIN "User" u ON u."id" = e."userId" WHERE u."deletedAt" IS NULL AND jsonb_exists(e."customFields", ${key}::text)`
    : await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "Employee" e JOIN "User" u ON u."id" = e."userId" WHERE u."deletedAt" IS NULL AND e."customFields"->>${key}::text = ${optionId}`;
  return rows[0]?.n ?? 0;
}

// ---------------------------------------------------------------------------
// New Field / Delete
// ---------------------------------------------------------------------------
// The names of the options a new dropdown starts with, in order (each gets its own id)
function newOptions(names: string[]): FieldOption[] {
  if (names.length > MAX_OPTIONS) throw new ServiceError(400, `A dropdown can have up to ${MAX_OPTIONS} options.`);
  const options: FieldOption[] = [];
  for (const raw of names) {
    const label = cleanOptionName(raw, options);
    options.push({ id: newOptionId(), label });
  }
  return options;
}

// `options` (names, in order) and `defaultOption` (the position of the default among them) are for a dropdown: it is
// created together with its choices. Every other type takes `defaultValue`.
export async function createUserField(ctx: AuthContext, input: { label: string; type: string; required?: boolean; defaultValue?: string | null; options?: string[]; defaultOption?: number | null }) {
  assertSuperAdmin(ctx);
  if (!CUSTOM_TYPE_SET.has(input.type)) throw new ServiceError(400, "Choose a field type from the list.");
  const type = input.type as UserFieldType;
  const stored = await readStored();
  const current = buildLayout(stored);
  if (readCustom(stored).length >= MAX_CUSTOM_USER_FIELDS) throw new ServiceError(400, `You can add up to ${MAX_CUSTOM_USER_FIELDS} new fields.`);
  const label = cleanFieldLabel(input.label, current.fields);

  let options: FieldOption[] = [];
  let defaultValue: string | null = null;
  if (type === "DROPDOWN") {
    options = newOptions(input.options ?? []);
    if (input.defaultOption !== undefined && input.defaultOption !== null) {
      const chosen = options[input.defaultOption];
      if (!chosen) throw new ServiceError(400, "Default value must be one of the options in the list.");
      defaultValue = chosen.id;
    }
    if (input.required && options.length === 0) throw new ServiceError(400, `Add at least one option before making "${label}" required.`);
  } else {
    if (input.options?.length) throw new ServiceError(400, "Only a dropdown has options.");
    defaultValue = cleanCustomDefault(type, [], input.defaultValue);
  }
  const field: StoredCustom = { key: newKey(), label, type, required: !!input.required, defaultValue, options };

  await saveStored(ctx, s => ({ ...s, custom: [...readCustom(s), field] }), {
    action: "USER_FIELD_CREATED",
    newValue: { key: field.key, label, type, required: field.required, ...(type === "DROPDOWN" ? { options: options.map(o => o.label) } : {}) },
  });
  const fields = (await getUserLayout()).fields;
  return { field: fields.find(f => f.key === field.key)!, fields };
}

// Only fields added with New Field can be deleted. If people have a value, the Super Admin must confirm first.
export async function deleteUserField(ctx: AuthContext, key: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const field = readCustom(await readStored()).find(c => c.key === key);
  if (!field) throw new ServiceError(404, "That field does not exist, or it is a standard field, which cannot be deleted.");
  const usage = await usageOf(key);
  if (usage > 0 && !confirm) {
    throw new ServiceError(409, `${usage} ${usage === 1 ? "person has" : "people have"} a value for "${field.label}". Confirm to delete the field and those values.`);
  }
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`UPDATE "Employee" SET "customFields" = "customFields" - ${key}::text WHERE jsonb_exists("customFields", ${key}::text)`;
    await mutateStored(tx, s => ({
      ...s,
      custom: readCustom(s).filter(c => c.key !== key),
      ...(Array.isArray(s.order) ? { order: s.order.filter(k => k !== key) } : {}),
    }));
    await writeAudit({ action: "USER_FIELD_DELETED", actorUserId: ctx.userId, oldValue: { key, label: field.label, type: field.type, peopleWithValue: usage } }, tx);
  });
  return { deleted: true, usage, fields: (await getUserLayout()).fields };
}

// ---------------------------------------------------------------------------
// The choices of a custom dropdown
// ---------------------------------------------------------------------------
async function dropdown(key: string) {
  const field = readCustom(await readStored()).find(c => c.key === key);
  if (!field) throw new ServiceError(404, "That field does not exist.");
  if (field.type !== "DROPDOWN") throw new ServiceError(400, `"${field.label}" is not a dropdown.`);
  return field;
}

// An option name, checked against the options already in the list (`exceptId` is the option being renamed)
function cleanOptionName(raw: string, existing: FieldOption[], exceptId?: string) {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) throw new ServiceError(400, "Option name is required.");
  if (name.length > USER_OPTION_LABEL_MAX) throw new ServiceError(400, `Option name must be ${USER_OPTION_LABEL_MAX} characters or fewer.`);
  if (existing.some(o => o.id !== exceptId && o.label.toLowerCase() === name.toLowerCase())) throw new ServiceError(409, `"${name}" is already in the list.`);
  return name;
}

const changeField = (key: string, change: (c: StoredCustom) => StoredCustom) => (s: Stored): Stored => ({
  ...s,
  custom: readCustom(s).map(c => (c.key === key ? change(c) : c)),
});

export async function listFieldOptions(ctx: AuthContext, key: string) {
  assertSuperAdmin(ctx);
  const field = await dropdown(key);
  const rows = await prisma.$queryRaw<{ v: string; n: number }[]>`SELECT e."customFields"->>${key}::text AS v, count(*)::int AS n FROM "Employee" e JOIN "User" u ON u."id" = e."userId" WHERE u."deletedAt" IS NULL AND e."customFields"->>${key}::text IS NOT NULL GROUP BY 1`;
  const usage = new Map(rows.map(r => [r.v, r.n]));
  return field.options.map(o => ({ id: o.id, name: o.label, usage: usage.get(o.id) ?? 0 }));
}

export async function addFieldOption(ctx: AuthContext, key: string, rawName: string) {
  assertSuperAdmin(ctx);
  const field = await dropdown(key);
  if (field.options.length >= MAX_OPTIONS) throw new ServiceError(400, `A dropdown can have up to ${MAX_OPTIONS} options.`);
  const name = cleanOptionName(rawName, field.options);
  const option = { id: newOptionId(), label: name };
  await saveStored(ctx, changeField(key, c => ({ ...c, options: [...c.options, option] })), {
    action: "DROPDOWN_OPTION_CREATED",
    newValue: { scope: "users", field: key, id: option.id, label: name },
  });
  return { id: option.id, name };
}

export async function renameFieldOption(ctx: AuthContext, key: string, optionId: string, rawName: string) {
  assertSuperAdmin(ctx);
  const field = await dropdown(key);
  const option = field.options.find(o => o.id === optionId);
  if (!option) throw new ServiceError(404, "That option does not exist.");
  const name = cleanOptionName(rawName, field.options, optionId);
  if (name === option.label) return;
  await saveStored(ctx, changeField(key, c => ({ ...c, options: c.options.map(o => (o.id === optionId ? { ...o, label: name } : o)) })), {
    action: "DROPDOWN_OPTION_UPDATED",
    oldValue: { scope: "users", field: key, id: optionId, label: option.label },
    newValue: { scope: "users", field: key, id: optionId, label: name },
  });
}

// An option that people have chosen is only removed after the Super Admin confirmed it; their value for the field is cleared
export async function deleteFieldOption(ctx: AuthContext, key: string, optionId: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const field = await dropdown(key);
  const option = field.options.find(o => o.id === optionId);
  if (!option) throw new ServiceError(404, "That option does not exist.");
  // A required dropdown with nothing to choose would stop every Create User / Edit User form from being saved
  if (field.required && field.options.length <= 1) {
    throw new ServiceError(400, `"${field.label}" is required, so it needs at least one option. Make it optional first, or add another option before deleting this one.`);
  }
  const usage = await usageOf(key, optionId);
  if (usage > 0 && !confirm) {
    throw new ServiceError(409, `${usage} ${usage === 1 ? "person has" : "people have"} chosen "${option.label}". Confirm to remove it from them.`);
  }
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`UPDATE "Employee" SET "customFields" = "customFields" - ${key}::text WHERE "customFields"->>${key}::text = ${optionId}`;
    await mutateStored(tx, changeField(key, c => ({ ...c, options: c.options.filter(o => o.id !== optionId), defaultValue: c.defaultValue === optionId ? null : c.defaultValue })));
    await writeAudit({ action: "DROPDOWN_OPTION_DELETED", actorUserId: ctx.userId, oldValue: { scope: "users", field: key, id: optionId, label: option.label, peopleWithValue: usage } }, tx);
  });
  return { deleted: true, usage };
}

export async function reorderFieldOptions(ctx: AuthContext, key: string, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  const field = await dropdown(key);
  const ids = field.options.map(o => o.id);
  if (new Set(orderedIds).size !== orderedIds.length || orderedIds.length !== ids.length || !orderedIds.every(id => ids.includes(id))) {
    throw new ServiceError(400, "The new order must list every option exactly once.");
  }
  await saveStored(ctx, changeField(key, c => ({ ...c, options: orderedIds.map(id => c.options.find(o => o.id === id)!) })), {
    action: "DROPDOWN_OPTIONS_REORDERED",
    newValue: { scope: "users", field: key, order: orderedIds },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// The values people have for the custom fields
// ---------------------------------------------------------------------------
// Checks what a form sent against the current layout and returns the clean values of the fields that were sent.
// create: every custom field is checked (a missing one counts as empty). update: only the fields that were sent.
export async function checkCustomValues(input: Record<string, unknown> | undefined, mode: "create" | "update"): Promise<Record<string, FieldValue>> {
  const custom = (await getUserLayout()).fields.filter(f => !f.isSystem);
  const given = input ?? {};
  if (Object.keys(given).some(k => !custom.some(f => f.key === k))) throw new ServiceError(400, "A field on this form no longer exists. Reload the page and try again.");
  const out: Record<string, FieldValue> = {};
  for (const f of custom) {
    const sent = Object.prototype.hasOwnProperty.call(given, f.key);
    if (!sent && mode === "update") continue;
    const res = cleanFieldValue(f.label, f.type, sent ? given[f.key] : null, f.options);
    if ("error" in res) throw new ServiceError(400, res.error);
    if (f.required && (f.type === "CHECKBOX" ? res.value !== true : res.value === null)) throw new ServiceError(400, `${f.label} is required.`);
    out[f.key] = res.value;
  }
  return out;
}

// The stored values after applying `clean` (a null clears that field)
export function mergeCustomValues(existing: unknown, clean: Record<string, FieldValue>): Record<string, string | number | boolean> {
  const base: Record<string, string | number | boolean> = existing && typeof existing === "object" && !Array.isArray(existing) ? { ...(existing as Record<string, string | number | boolean>) } : {};
  for (const [k, v] of Object.entries(clean)) {
    if (v === null) delete base[k];
    else base[k] = v;
  }
  return base;
}
