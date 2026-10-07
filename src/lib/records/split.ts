// Reading and checking the values of a layout's fields for a module with its own screens (Projects, Customers): the same rules as the record forms
// (cleanValue), for the fields that were sent. Shared by the services of those modules.

import { Prisma } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/db";
import { cleanValue, isEmptyValue } from "./values";
import type { LayoutField } from "./types";

export const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

// ---------------------------------------------------------------------------
// Numbers and days as the database holds them
// ---------------------------------------------------------------------------
type DecimalLike = { toNumber(): number };
const isDecimal = (v: unknown): v is DecimalLike => !!v && typeof v === "object" && typeof (v as DecimalLike).toNumber === "function";
export const dec = (v: unknown): number | null => (v === null || v === undefined ? null : typeof v === "number" ? v : isDecimal(v) ? v.toNumber() : null);
export const decOr0 = (v: unknown): number => dec(v) ?? 0;
export const dayOf = (d: Date | null | undefined): string | null => (d instanceof Date ? d.toISOString().slice(0, 10) : null);
export const dayDate = (day: string | null | undefined): Date | null => (day ? new Date(`${day}T00:00:00.000Z`) : null);

// The value of a field in a database row: a column for a standard field, customFields for one added in Edit Page Layout
export function fieldValue(f: LayoutField, row: Record<string, unknown>): unknown {
  const raw = f.isSystem ? row[f.key] : isObject(row.customFields) ? row.customFields[f.key] : undefined;
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) return dayOf(raw);
  if (isDecimal(raw)) return raw.toNumber();
  return raw;
}

// What an edit changes, for the log
export function changes(before: Record<string, unknown>, after: Record<string, unknown>) {
  const text = (x: unknown) => (x === null || x === undefined ? null : x instanceof Date ? x.toISOString().slice(0, 10) : isDecimal(x) ? String(x.toNumber()) : typeof x === "object" ? JSON.stringify(x) : String(x));
  const from: Record<string, unknown> = {};
  const to: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(after)) if (text(before[k]) !== text(v)) { from[k] = text(before[k]); to[k] = text(v); }
  return { from, to };
}

// ---------------------------------------------------------------------------
// Checking what a page sent for the fields of a layout section
// ---------------------------------------------------------------------------
const issue = (path: (string | number)[], message: string): ZodIssue => ({ code: "custom", path, message });
const emptyOf = (f: LayoutField, value: unknown) => (f.type === "CHECKBOX" ? value !== true : f.type === "FILE" ? (value as unknown[]).length === 0 : isEmptyValue(value));

export type Split = {
  columns: Record<string, unknown>; // the standard columns (a DATE field as a Date), null = clear
  custom: Record<string, unknown>; // the fields added in Edit Page Layout, null = clear
  slots: { fieldKey: string; ids: string[] }[]; // File Upload fields: the ids of the files the row should have now
};

// The lists a Lookup field added in Edit Page Layout can point to, and how to check that a record of each exists
async function lookupExists(kind: string | null, ids: string[]): Promise<Set<string>> {
  const where = { id: { in: ids } };
  const rows = kind === "deal" ? await prisma.deal.findMany({ where: { ...where, deletedAt: null }, select: { id: true } })
    : kind === "customer" ? await prisma.customer.findMany({ where, select: { id: true } })
    : kind === "project" ? await prisma.project.findMany({ where: { ...where, deletedAt: null }, select: { id: true } })
    : kind === "materialVendor" ? await prisma.materialVendor.findMany({ where: { ...where, deletedAt: null }, select: { id: true } })
    : kind === "serviceVendor" ? await prisma.serviceVendor.findMany({ where: { ...where, deletedAt: null }, select: { id: true } })
    : [];
  return new Set(rows.map(r => r.id));
}

export async function splitValues(fields: LayoutField[], values: unknown, skip: string[] = []): Promise<Split> {
  const given = isObject(values) ? values : {};
  const out: Split = { columns: {}, custom: {}, slots: [] };
  const issues: ZodIssue[] = [];
  const users = new Map<string, { label: string; path: (string | number)[] }>();
  const lookups: { kind: string | null; id: string; label: string; path: (string | number)[] }[] = [];
  for (const key of Object.keys(given)) {
    const f = fields.find(x => x.key === key);
    const path = ["values", key];
    if (!f || !f.enabled || f.type === "CALC" || f.type === "AUTO" || f.type === "APPROVER" || f.readOnly || skip.includes(key)) {
      issues.push(issue(path, "A field on this page no longer exists or cannot be changed. Reload the page and try again."));
      continue;
    }
    const res = cleanValue(f, given[key]);
    if ("error" in res) { issues.push(issue(path, res.error)); continue; }
    if (f.required && emptyOf(f, res.value)) { issues.push(issue(path, `${f.label} is required`)); continue; }
    if (f.type === "FILE") { out.slots.push({ fieldKey: key, ids: res.value as string[] }); continue; }
    if (f.type === "USER" && typeof res.value === "string") users.set(res.value, { label: f.label, path });
    if (f.type === "LOOKUP" && typeof res.value === "string") lookups.push({ kind: f.lookup, id: res.value, label: f.label, path });
    // a standard tick box is a yes / no column: unticked is false, not empty
    if (f.isSystem) out.columns[key] = f.type === "CHECKBOX" ? res.value === true : f.type === "DATE" && typeof res.value === "string" ? dayDate(res.value) : res.value;
    else out.custom[key] = res.value;
  }
  if (issues.length) throw new ZodError(issues);
  if (users.size) {
    const found = new Set((await prisma.user.findMany({ where: { id: { in: Array.from(users.keys()) }, status: "ACTIVE", deletedAt: null }, select: { id: true } })).map(u => u.id));
    for (const [id, v] of users) if (!found.has(id)) issues.push(issue(v.path, `${v.label} must be one of the active users`));
    if (issues.length) throw new ZodError(issues);
  }
  for (const kind of Array.from(new Set(lookups.map(l => l.kind)))) {
    const mine = lookups.filter(l => l.kind === kind);
    const found = await lookupExists(kind, mine.map(l => l.id));
    for (const l of mine) if (!found.has(l.id)) issues.push(issue(l.path, `${l.label} must be an existing record`));
  }
  if (issues.length) throw new ZodError(issues);
  return out;
}

// A JSON column after a change: what was there, with the changed fields on top, empty ones removed
export function mergeCustom(before: unknown, change: Record<string, unknown>): Prisma.InputJsonValue | typeof Prisma.DbNull {
  const merged: Record<string, unknown> = { ...(isObject(before) ? before : {}), ...change };
  for (const k of Object.keys(merged)) if (merged[k] === null || merged[k] === undefined) delete merged[k];
  return Object.keys(merged).length ? (merged as Prisma.InputJsonObject) : Prisma.DbNull;
}
