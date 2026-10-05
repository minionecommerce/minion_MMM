import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "./service";
import {
  CUSTOM_TYPE_SET,
  SUPER_ADMIN_OPTION,
  USER_COLUMNS,
  USER_FIELDS,
  USER_FIELD_LABEL_MAX,
  cleanFieldValue,
  type FieldOption,
  type UserColumnId,
  type UserFieldDto,
  type UserFieldKey,
  type UserFieldType,
  type UserLayout,
} from "./layout-shared";

// Everything is kept in one small JSON row, so the layout needs no per-field tables.
// Anything missing from it falls back to the built-in default, so a new field or column never disappears.
const KEY = "layout";

// An access level of the Access field: a name people pick in Create / Edit User, linked to the Role that gives the permissions.
// (Super Admin is not stored here: it is the built-in first option.)
export type AccessLevel = { id: string; label: string; roleId: string | null };

// A field added with New Field (its values live in Employee.customFields under `key`)
export type StoredCustom = { key: string; label: string; type: UserFieldType; required: boolean; defaultValue: string | null; options: FieldOption[] };

export type Stored = {
  fields?: Record<string, { label?: unknown; required?: unknown; defaultValue?: unknown }>; // changes to the system fields
  custom?: unknown; // StoredCustom[]
  access?: unknown; // { options: AccessLevel[] }: the access levels of the Access field
  order?: unknown;
  columns?: unknown;
  departmentOrder?: unknown; // department ids, in the order the Department pick list shows them
};

const DEFAULT_COLUMNS = USER_COLUMNS.map(c => c.id) as UserColumnId[];
const SYSTEM_KEYS: string[] = USER_FIELDS.map(f => f.key);

export function assertSuperAdmin(ctx: AuthContext) {
  if (!ctx.isSuperAdmin) throw new ServiceError(403, "Only a Super Admin can edit the page layout.");
}

export const asStored = (value: unknown): Stored => (value && typeof value === "object" && !Array.isArray(value) ? (value as Stored) : {});

const str = (v: unknown): v is string => typeof v === "string";

// The custom fields in a stored layout; anything malformed is ignored
export function readCustom(stored: Stored): StoredCustom[] {
  if (!Array.isArray(stored.custom)) return [];
  const out: StoredCustom[] = [];
  for (const c of stored.custom as Record<string, unknown>[]) {
    if (!c || !str(c.key) || !c.key.startsWith("cf_") || !str(c.label) || !str(c.type) || !CUSTOM_TYPE_SET.has(c.type)) continue;
    const options = Array.isArray(c.options) ? (c.options as Record<string, unknown>[]).filter(o => o && str(o.id) && str(o.label)).map(o => ({ id: o.id as string, label: o.label as string })) : [];
    out.push({ key: c.key, label: c.label, type: c.type as UserFieldType, required: c.required === true, defaultValue: str(c.defaultValue) && c.defaultValue ? c.defaultValue : null, options });
  }
  return out;
}

// The access levels in a stored layout (in order); anything malformed is ignored
export function readAccess(stored: Stored): AccessLevel[] {
  const list = (stored.access as { options?: unknown } | undefined)?.options;
  if (!Array.isArray(list)) return [];
  const out: AccessLevel[] = [];
  for (const o of list as Record<string, unknown>[]) {
    if (!o || !str(o.id) || o.id === SUPER_ADMIN_OPTION.id || !str(o.label) || !o.label.trim() || out.some(x => x.id === o.id)) continue;
    out.push({ id: o.id, label: o.label, roleId: str(o.roleId) && o.roleId ? o.roleId : null });
  }
  return out;
}

// Saved order first, then anything not mentioned, each exactly once
function ordered<T extends string>(saved: unknown, all: readonly T[]): T[] {
  const list = Array.isArray(saved) ? saved.filter((v): v is T => all.includes(v as T)) : [];
  const seen = new Set<string>();
  const first = list.filter(v => (seen.has(v) ? false : (seen.add(v), true)));
  return [...first, ...all.filter(v => !seen.has(v))];
}

export function buildLayout(raw: unknown): UserLayout {
  const stored = asStored(raw);
  const systemByKey = new Map(USER_FIELDS.map(f => [f.key as string, f]));
  const customByKey = new Map(readCustom(stored).map(c => [c.key, c]));
  const keys = ordered(stored.order, [...SYSTEM_KEYS, ...customByKey.keys()]);
  const fields = keys.map((key): UserFieldDto => {
    const custom = customByKey.get(key);
    if (custom) {
      return {
        key, label: custom.label, type: custom.type, isSystem: false, required: custom.required, requiredLocked: false, defaultable: true,
        defaultValue: custom.defaultValue, options: custom.type === "DROPDOWN" ? custom.options : null,
      };
    }
    const def = systemByKey.get(key)!;
    const own = stored.fields?.[key] ?? {};
    if (key === "access") {
      // Super Admin first (built in), then the access levels; the default can only be one of the levels
      const levels = readAccess(stored);
      return {
        ...def,
        isSystem: true,
        label: str(own.label) && own.label.trim() ? own.label.trim() : def.label,
        required: true,
        defaultValue: str(own.defaultValue) && levels.some(l => l.id === own.defaultValue) ? own.defaultValue : null,
        options: [SUPER_ADMIN_OPTION, ...levels.map(l => ({ id: l.id, label: l.label, roleId: l.roleId }))],
      };
    }
    return {
      ...def,
      isSystem: true,
      label: str(own.label) && own.label.trim() ? own.label.trim() : def.label,
      required: def.requiredLocked ? def.required : typeof own.required === "boolean" ? own.required : def.required,
      defaultValue: def.defaultable && str(own.defaultValue) && own.defaultValue ? own.defaultValue : null,
      options: null,
    };
  });
  return { fields, columns: ordered(stored.columns, DEFAULT_COLUMNS) };
}

export async function readStored(): Promise<Stored> {
  const row = await prisma.userSetting.findUnique({ where: { key: KEY }, select: { value: true } });
  return asStored(row?.value);
}

export async function getUserLayout(): Promise<UserLayout> {
  try {
    return buildLayout(await readStored());
  } catch (err) {
    // The page must still work (with the standard layout) if the settings table cannot be read
    console.error("Could not read the users page layout:", err);
    return buildLayout(null);
  }
}

// Read-change-write of the one layout row, inside the caller's transaction
export async function mutateStored(tx: Prisma.TransactionClient, change: (stored: Stored) => Stored) {
  const row = await tx.userSetting.findUnique({ where: { key: KEY }, select: { value: true } });
  const next = change(structuredClone(asStored(row?.value)));
  await tx.userSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: next as Prisma.InputJsonValue }, update: { value: next as Prisma.InputJsonValue } });
}

export async function saveStored(ctx: AuthContext, change: (stored: Stored) => Stored, audit: Parameters<typeof writeAudit>[0]) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await mutateStored(tx, change);
    await writeAudit({ ...audit, actorUserId: ctx.userId }, tx);
  });
}

// Department ids in the saved order (empty when it was never changed)
export async function getDepartmentOrder(): Promise<string[]> {
  try {
    const saved = (await readStored()).departmentOrder;
    return Array.isArray(saved) ? saved.filter(str) : [];
  } catch {
    return [];
  }
}

// Saved order first, then anything not mentioned (e.g. a department added since) by name
export function sortDepartments<T extends { id: string; name: string }>(rows: T[], saved: string[]): T[] {
  const rank = new Map(saved.map((id, i) => [id, i]));
  return [...rows].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
export function cleanFieldLabel(raw: string, current: UserFieldDto[], exceptKey?: string) {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!label) throw new ServiceError(400, "Field label is required.");
  if (label.length > USER_FIELD_LABEL_MAX) throw new ServiceError(400, `Field label must be ${USER_FIELD_LABEL_MAX} characters or fewer.`);
  if (current.some(f => f.key !== exceptKey && f.label.toLowerCase() === label.toLowerCase())) throw new ServiceError(409, `Another field is already called "${label}".`);
  return label;
}

// A default value as the text that is stored (null = none) for a custom field
export function cleanCustomDefault(type: UserFieldType, options: FieldOption[], raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const res = cleanFieldValue("Default value", type, v, options);
  if ("error" in res) throw new ServiceError(400, res.error);
  return res.value === null ? null : String(res.value);
}

// ---------------------------------------------------------------------------
// Edit Properties of one field: label, required, default value
// ---------------------------------------------------------------------------
export async function updateUserField(ctx: AuthContext, key: string, input: { label?: string; required?: boolean; defaultValue?: string | null }) {
  assertSuperAdmin(ctx);
  const stored0 = await readStored();
  const current = buildLayout(stored0);
  const before = current.fields.find(f => f.key === key);
  if (!before) throw new ServiceError(404, "That field does not exist.");
  const def = before.isSystem ? USER_FIELDS.find(f => f.key === key)! : null;

  const label = input.label !== undefined ? cleanFieldLabel(input.label, current.fields, key) : before.label;

  let required = before.required;
  if (input.required !== undefined && input.required !== before.required) {
    if (before.requiredLocked) throw new ServiceError(400, `${before.label} is always required.`);
    required = input.required;
    // A required dropdown with nothing to choose would stop every Create User / Edit User form from being saved
    if (required && before.type === "DROPDOWN") {
      const choices = key === "departmentId" ? await prisma.department.count() : before.options?.length ?? 0;
      if (choices === 0) throw new ServiceError(400, `Add at least one option to "${before.label}" before making it required.`);
    }
  }

  let defaultValue = before.defaultValue;
  if (input.defaultValue !== undefined) {
    const v = (input.defaultValue ?? "").trim();
    if (v && !before.defaultable) throw new ServiceError(400, `${before.label} cannot have a default value.`);
    if (!v) defaultValue = null;
    else if (!before.isSystem) defaultValue = cleanCustomDefault(before.type, before.options ?? [], v);
    else {
      if (key === "departmentId") {
        const dept = await prisma.department.findUnique({ where: { id: v }, select: { id: true } });
        if (!dept) throw new ServiceError(400, "Default value must be one of the departments.");
      } else if (key === "access") {
        if (!readAccess(stored0).some(l => l.id === v)) throw new ServiceError(400, "Default value must be one of the access levels (Super Admin cannot be a default).");
      } else if (v.length > 120) throw new ServiceError(400, "Default value is too long.");
      defaultValue = v;
    }
  }

  await saveStored(
    ctx,
    stored => {
      if (def) {
        // Only what differs from the built-in setup is stored
        const entry: Record<string, unknown> = {};
        if (label !== def.label) entry.label = label;
        if (!def.requiredLocked && required !== def.required) entry.required = required;
        if (defaultValue) entry.defaultValue = defaultValue;
        const fields = { ...(stored.fields ?? {}) };
        if (Object.keys(entry).length) fields[key] = entry;
        else delete fields[key];
        return { ...stored, fields };
      }
      return { ...stored, custom: readCustom(stored).map(c => (c.key === key ? { ...c, label, required, defaultValue } : c)) };
    },
    {
      action: "USER_FIELD_UPDATED",
      oldValue: { key, label: before.label, required: before.required, defaultValue: before.defaultValue },
      newValue: { key, label, required, defaultValue },
    },
  );
  return (await getUserLayout()).fields;
}

// ---------------------------------------------------------------------------
// Order of the form fields and of the table columns
// ---------------------------------------------------------------------------
function assertCompleteOrder(ids: string[], all: readonly string[], what: string) {
  if (ids.length !== all.length || new Set(ids).size !== ids.length || !ids.every(id => all.includes(id))) {
    throw new ServiceError(400, `The new ${what} order must list every ${what} exactly once.`);
  }
}

export async function reorderUserFields(ctx: AuthContext, keys: string[]) {
  assertSuperAdmin(ctx);
  assertCompleteOrder(keys, buildLayout(await readStored()).fields.map(f => f.key), "field");
  await saveStored(ctx, stored => ({ ...stored, order: keys }), { action: "USER_FIELDS_REORDERED", newValue: { order: keys } });
  return { ok: true };
}

export async function setUserColumnOrder(ctx: AuthContext, ids: string[]) {
  assertSuperAdmin(ctx);
  assertCompleteOrder(ids, DEFAULT_COLUMNS, "column");
  await saveStored(ctx, stored => ({ ...stored, columns: ids }), { action: "USER_COLUMNS_REORDERED", newValue: { order: ids } });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Required system fields, enforced on the server as well as in the forms
// (the custom fields are checked with their values: see custom-fields.ts)
// ---------------------------------------------------------------------------
// create: a missing value counts as empty. update: only the fields that are being changed are checked.
export async function findUserLayoutProblem(values: Partial<Record<UserFieldKey, string | null | undefined>>, mode: "create" | "update"): Promise<string | null> {
  const layout = await getUserLayout();
  for (const f of layout.fields) {
    if (!f.isSystem || !f.required || f.requiredLocked) continue;
    const v = values[f.key as UserFieldKey];
    if (v === undefined && mode === "update") continue;
    if (!(v ?? "").toString().trim()) return `${f.label} is required.`;
  }
  return null;
}
