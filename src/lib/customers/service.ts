// Customers: the form (layout + record), create, edit, the customer number. The checks follow the Customer layout (Edit Page Layout) and the GST rules
// of the chosen GST Treatment; a customer is never added twice (the same mobile or email is refused, the same name asks first).

import type { Prisma } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { removeObjects } from "@/lib/leads/storage";
import { getLayout } from "@/lib/records/layout";
import { bindFiles, filesOf, slotKey } from "@/lib/records/files";
import { activeUsers } from "@/lib/records/lookups";
import { changes, fieldValue, isObject, mergeCustom, splitValues, type Split } from "@/lib/records/split";
import { isEmptyValue, isId } from "@/lib/records/values";
import type { FileDto, LayoutField, ModuleLayoutDto } from "@/lib/records/types";
import type { CustomerDto } from "@/lib/quotes/types";
import { customerAbilities, needCustomerWriter } from "./access";
import { CUSTOMER_COUNTER, CUSTOMER_DIGITS, CUSTOMER_PREFIX, formatCustomerCode, HOME_STATE_CODE } from "./constants";
import { CUSTOMER_SELECT, toCustomer } from "./dto";
import { addressLines, withCountryCode } from "./format";
import { nextCustomerCode, peekNextCustomerCode } from "./numbering";
import { GST_DEPENDENT, gstRules, PAN_SHAPE, validateGstin } from "./gst";
import type { CustomerFormData, CustomerRecord } from "./types";

const TX = { maxWait: 10_000, timeout: 20_000 };
const issue = (key: string, message: string): ZodIssue => ({ code: "custom", path: ["values", key], message });

export class DuplicateCustomerError extends Error {
  constructor(public existing: CustomerDto, public hard: boolean, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// The customer number: CUS-00001 ... (the counter itself is in ./numbering)
// ---------------------------------------------------------------------------
async function highestUsedNumber(): Promise<number> {
  const pattern = `^${CUSTOMER_PREFIX}[0-9]+$`;
  const rows = await prisma.$queryRaw<{ n: number | null }[]>`SELECT max(substring("customerCode" from ${CUSTOMER_PREFIX.length + 1})::bigint)::float8 AS n FROM "Customer" WHERE "customerCode" ~ ${pattern}`;
  return Number(rows[0]?.n ?? 0);
}

export async function getNumbering() {
  return { prefix: CUSTOMER_PREFIX, digits: CUSTOMER_DIGITS, next: await peekNextCustomerCode(), highest: await highestUsedNumber() };
}

// The gear next to Customer Number: the number the next customer gets (it has to be higher than every number in use)
export async function setNextCustomerNumber(ctx: AuthContext, next: unknown) {
  assertSuperAdmin(ctx);
  if (typeof next !== "number" || !Number.isInteger(next) || next < 1 || next > 99_999_999) throw new ServiceError(400, "The next number must be a whole number from 1 to 99999999.");
  const top = await highestUsedNumber();
  if (next <= top) throw new ServiceError(409, `The next number has to be higher than ${formatCustomerCode(top)}, which is already used.`);
  await prisma.$executeRaw`INSERT INTO "Counter" ("key", "value", "updatedAt") VALUES (${CUSTOMER_COUNTER}, ${next - 1}, now())
    ON CONFLICT ("key") DO UPDATE SET "value" = ${next - 1}, "updatedAt" = now()`;
  return { next: formatCustomerCode(next) };
}

// ---------------------------------------------------------------------------
// Reading a customer for the form
// ---------------------------------------------------------------------------
const BILL_KEYS = ["billAttention", "billCountry", "billStreet1", "billStreet2", "billCity", "billState", "billPinCode"] as const;

function toRecord(row: Record<string, unknown> & { id: string }, layout: ModuleLayoutDto, files: Map<string, FileDto[]>): CustomerRecord {
  const values: Record<string, unknown> = {};
  for (const f of layout.fields) {
    if (f.type === "FILE") { values[f.key] = files.get(slotKey(null, f.key)) ?? []; continue; }
    if (f.key === "customerCode") { values[f.key] = row.customerCode ?? ""; continue; }
    values[f.key] = fieldValue(f, row);
  }
  // A customer of the older kinds (Company, Builder ...) is a Business here
  const type = values.customerType;
  const typeField = layout.fields.find(f => f.key === "customerType");
  if (typeField && typeof type === "string" && !typeField.options.some(o => o.id === type)) values.customerType = "Business";
  // An address that was typed as one text before the structured address existed is shown in Street 1, so saving keeps it
  const legacy = typeof row.address === "string" ? row.address.trim() : "";
  if (legacy && BILL_KEYS.every(k => !row[k]) && "billStreet1" in values) values.billStreet1 = legacy;
  return { id: row.id, code: typeof row.customerCode === "string" ? row.customerCode : null, values, updatedAt: (row.updatedAt as Date).toISOString() };
}

export async function getCustomerForm(ctx: AuthContext, id: string | null): Promise<CustomerFormData> {
  needCustomerWriter(ctx, id ? "edit" : "create");
  const [layout, users] = await Promise.all([getLayout("customer"), activeUsers()]);
  let record: CustomerRecord | null = null;
  if (id) {
    if (!isId(id)) throw new ServiceError(404, "Customer not found");
    const row = await prisma.customer.findUnique({ where: { id } });
    if (!row) throw new ServiceError(404, "Customer not found");
    record = toRecord(row as unknown as Record<string, unknown> & { id: string }, layout, await filesOf("customer", id));
  }
  return { layout, record, users, nextCode: await peekNextCustomerCode(), abilities: customerAbilities(ctx) };
}

// ---------------------------------------------------------------------------
// Checking what the form sent
// ---------------------------------------------------------------------------
type Prepared = { columns: Record<string, unknown>; custom: Record<string, unknown>; slots: Split["slots"]; final: Record<string, unknown> };

async function prepare(rawValues: unknown, existing: Record<string, unknown> | null): Promise<Prepared> {
  const layout = await getLayout("customer");
  const fields = layout.fields.filter(f => f.enabled);
  const given: Record<string, unknown> = isObject(rawValues) ? { ...rawValues } : {};
  delete given.customerCode; // the number is given by the system

  const known = (key: string): unknown => {
    if (key in given) return given[key];
    const f = layout.fields.find(x => x.key === key);
    return f && existing ? fieldValue(f, existing) : null;
  };
  const treatment = known("gstTreatment");
  const rules = gstRules(treatment);
  const applies = (key: string) => !GST_DEPENDENT[key] || GST_DEPENDENT[key](rules);
  for (const key of Object.keys(GST_DEPENDENT)) if (!applies(key)) delete given[key];
  // what the GST Treatment asks for decides what is mandatory: GSTIN for a registered business; nothing for a field that does not apply
  const effective: LayoutField[] = fields.map(f => {
    if (f.key === "gstin") return { ...f, required: f.required || rules.gstin === "required" };
    return applies(f.key) ? f : { ...f, required: false };
  });

  const issues: ZodIssue[] = [];
  let split: Split = { columns: {}, custom: {}, slots: [] };
  try {
    split = await splitValues(effective, given);
  } catch (e) {
    if (e instanceof ZodError) issues.push(...e.issues); else throw e;
  }
  const reported = new Set(issues.map(i => String(i.path[1])));

  // the values as they will be after this save
  const final: Record<string, unknown> = {};
  for (const f of layout.fields) {
    if (f.type === "FILE") continue;
    final[f.key] = f.key in split.columns ? split.columns[f.key] : f.key in split.custom ? split.custom[f.key] : existing ? fieldValue(f, existing) : null;
  }
  // a mandatory field has to have a value, also when the form left it out
  for (const f of effective) {
    if (!f.required || f.type === "AUTO" || f.type === "FILE" || f.type === "CALC" || f.readOnly || reported.has(f.key)) continue;
    if (f.type === "CHECKBOX" ? final[f.key] !== true : isEmptyValue(final[f.key])) issues.push(issue(f.key, `${f.label} is required`));
  }

  // GST: the GSTIN has to be a real one, the PAN has to be a PAN (and the one inside the GSTIN)
  const text = (key: string) => (typeof final[key] === "string" ? (final[key] as string).trim() : "");
  const columns = { ...split.columns };
  const custom = { ...split.custom };
  // an email is kept in lower case; a phone number always has its country code (a number typed without one is an Indian number)
  if (typeof columns.email === "string") { columns.email = columns.email.toLowerCase(); final.email = columns.email; }
  for (const f of layout.fields) {
    if (f.type !== "PHONE") continue;
    const bag = f.isSystem ? columns : custom;
    if (typeof bag[f.key] === "string") { bag[f.key] = withCountryCode(bag[f.key] as string); final[f.key] = bag[f.key]; }
  }
  const gstin = text("gstin");
  if (rules.gstin !== "none" && gstin && !reported.has("gstin")) {
    const result = validateGstin(gstin);
    if (!result.ok) issues.push(issue("gstin", result.error));
    else {
      columns.gstin = result.gstin;
      final.gstin = result.gstin;
      const pan = text("pan").toUpperCase();
      if (pan && pan !== result.pan && !reported.has("pan")) issues.push(issue("pan", "The PAN is part of the GSTIN (its 3rd to 12th characters). They do not match."));
    }
  }
  const pan = text("pan").toUpperCase();
  if (applies("pan") && pan && !reported.has("pan")) {
    if (!PAN_SHAPE.test(pan)) issues.push(issue("pan", "PAN has 10 characters, like ABCDE1234F."));
    else { columns.pan = pan; final.pan = pan; }
  }
  if (issues.length) throw new ZodError(issues);

  // what does not apply to the GST Treatment is emptied (a customer changed from Registered to Consumer keeps no GSTIN)
  for (const key of Object.keys(GST_DEPENDENT)) if (!applies(key) && layout.fields.some(f => f.key === key && f.isSystem)) { columns[key] = null; final[key] = null; }
  // a Consumer buys in the home state and pays tax
  if (treatment === "consumer") {
    if (!final.placeOfSupply && layout.fields.some(f => f.key === "placeOfSupply")) { columns.placeOfSupply = HOME_STATE_CODE; final.placeOfSupply = HOME_STATE_CODE; }
    if (!final.taxPreference && layout.fields.some(f => f.key === "taxPreference")) { columns.taxPreference = "taxable"; final.taxPreference = "taxable"; }
  }
  // the Billing Address as printed lines is kept in "address" for the screens that only know that one column
  if (Object.keys(given).some(k => (BILL_KEYS as readonly string[]).includes(k))) {
    const lines = addressLines({
      attention: text("billAttention"), street1: text("billStreet1"), street2: text("billStreet2"), city: text("billCity"),
      state: text("billState"), pinCode: text("billPinCode"), country: text("billCountry"),
    });
    columns.address = lines.length ? lines.join("\n") : null;
  }
  return { columns, custom, slots: split.slots, final };
}

// The same mobile number or email is never added twice; the same name asks first
async function checkDuplicates(final: Record<string, unknown>, selfId: string | null, force: boolean, existing: { name: string; phone: string | null; email: string | null } | null) {
  const self = selfId ?? "";
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const phone = text(final.phone);
  const digits = phone.replace(/\D/g, "");
  if (phone && digits && digits !== (existing?.phone ?? "").replace(/\D/g, "")) {
    // Older customers were typed with spaces and without the country code: compare the last 10 digits
    const last = digits.length >= 10 ? digits.slice(-10) : digits;
    const hit = digits.length >= 10
      ? await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Customer" WHERE right(regexp_replace("phone", '[^0-9]', '', 'g'), 10) = ${last} AND "id" <> ${self} LIMIT 1`
      : await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Customer" WHERE regexp_replace("phone", '[^0-9]', '', 'g') = ${last} AND "id" <> ${self} LIMIT 1`;
    if (hit[0]) throw new DuplicateCustomerError(await dtoOf(hit[0].id), true, "A customer with this mobile number already exists.");
  }
  const email = text(final.email).toLowerCase();
  if (email && email !== (existing?.email ?? "").toLowerCase()) {
    const hit = await prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" }, NOT: { id: self } }, select: { id: true } });
    if (hit) throw new DuplicateCustomerError(await dtoOf(hit.id), true, "A customer with this email address already exists.");
  }
  const name = text(final.name);
  if (!force && name && name.toLowerCase() !== (existing?.name ?? "").toLowerCase()) {
    const hit = await prisma.customer.findFirst({ where: { name: { equals: name, mode: "insensitive" }, NOT: { id: self } }, select: { id: true, name: true } });
    if (hit) throw new DuplicateCustomerError(await dtoOf(hit.id), false, `A customer called "${hit.name}" already exists.`);
  }
}

async function dtoOf(id: string): Promise<CustomerDto> {
  return toCustomer((await prisma.customer.findUniqueOrThrow({ where: { id }, select: CUSTOMER_SELECT })));
}

// ---------------------------------------------------------------------------
// Create and edit
// ---------------------------------------------------------------------------
export async function createCustomerFromForm(ctx: AuthContext, body: { values: unknown; force?: boolean }): Promise<CustomerDto> {
  needCustomerWriter(ctx, "create");
  const p = await prepare(body.values, null);
  await checkDuplicates(p.final, null, body.force === true, null);
  const removed: string[] = [];
  const created = await prisma.$transaction(async tx => {
    const code = await nextCustomerCode(tx);
    const row = await tx.customer.create({
      data: { ...p.columns, ...(Object.keys(p.custom).length ? { customFields: mergeCustom(null, p.custom) } : {}), customerCode: code, status: "Active" } as Prisma.CustomerUncheckedCreateInput,
      select: CUSTOMER_SELECT,
    });
    if (p.slots.length) removed.push(...(await bindFiles(tx, ctx, "customer", row.id, p.slots.map(s => ({ ...s, rowId: null })), [])));
    await tx.cRMAuditLog.create({ data: { entityType: "Customer", entityId: row.id, action: "Created", performedById: ctx.employeeId, newValue: JSON.stringify({ customerCode: code, name: row.name }) } });
    return row;
  }, TX);
  await removeObjects(removed);
  return toCustomer(created);
}

export async function updateCustomerFromForm(ctx: AuthContext, id: string, body: { values: unknown; force?: boolean }): Promise<CustomerDto> {
  needCustomerWriter(ctx, "edit");
  if (!isId(id)) throw new ServiceError(404, "Customer not found");
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new ServiceError(404, "Customer not found");
  const before = existing as unknown as Record<string, unknown>;
  const p = await prepare(body.values, before);
  await checkDuplicates(p.final, id, body.force === true, { name: existing.name, phone: existing.phone, email: existing.email });
  const removed: string[] = [];
  const updated = await prisma.$transaction(async tx => {
    const row = await tx.customer.update({
      where: { id },
      data: { ...p.columns, ...(Object.keys(p.custom).length ? { customFields: mergeCustom(existing.customFields, p.custom) } : {}) } as Prisma.CustomerUncheckedUpdateInput,
      select: CUSTOMER_SELECT,
    });
    if (p.slots.length) removed.push(...(await bindFiles(tx, ctx, "customer", id, p.slots.map(s => ({ ...s, rowId: null })), [])));
    const diff = changes(before, { ...p.columns, ...Object.fromEntries(Object.entries(p.custom).map(([k, v]) => [`customFields.${k}`, v])) });
    if (Object.keys(diff.to).length || p.slots.length) {
      await tx.cRMAuditLog.create({
        data: { entityType: "Customer", entityId: id, action: "Updated", performedById: ctx.employeeId, oldValue: JSON.stringify(diff.from), newValue: JSON.stringify({ ...diff.to, ...(p.slots.length ? { filesSaved: p.slots.map(s => s.fieldKey) } : {}) }) },
      });
    }
    return row;
  }, TX);
  await removeObjects(removed);
  return toCustomer(updated);
}
