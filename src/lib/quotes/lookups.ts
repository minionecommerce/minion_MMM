// The pick-lists of the quote form, read from the live CRM data: customers, the projects of a customer, the items of the catalogue.
// A new customer, project or item shows up in the next list that is opened.

import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { normalizePhone } from "@/lib/leads/format";
import { isId, stripControl } from "@/lib/records/values";
import type { LookupItem } from "@/lib/records/types";
import { toItem } from "./catalog";
import { needQuoteWriter } from "./access";
import type { CustomerDto, ItemDto } from "./types";

const LIMIT = 30;
const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

export const toCustomer = (c: { id: string; customerCode: string | null; name: string; phone: string | null; email: string | null; address: string | null; gstin: string | null; customerType: string }): CustomerDto => ({
  id: c.id, code: c.customerCode, name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin, customerType: c.customerType,
});
const CUSTOMER_SELECT = { id: true, customerCode: true, name: true, phone: true, email: true, address: true, gstin: true, customerType: true, status: true } as const;

export async function searchCustomers(q: string): Promise<(LookupItem & { customer: CustomerDto })[]> {
  const text = q.trim();
  const rows = await prisma.customer.findMany({
    where: text ? { OR: [{ name: contains(text) }, { phone: contains(text) }, { email: contains(text) }, { customerCode: contains(text) }] } : {},
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: LIMIT,
    select: CUSTOMER_SELECT,
  });
  return rows.map(c => ({ id: c.id, label: c.name, sub: [c.phone, c.email].filter(Boolean).join(" · ") || null, tag: c.status === "Active" ? null : c.status, customer: toCustomer(c) }));
}

export async function getCustomer(id: string): Promise<CustomerDto | null> {
  if (!isId(id)) return null;
  const c = await prisma.customer.findUnique({ where: { id }, select: CUSTOMER_SELECT });
  return c ? toCustomer(c) : null;
}

// The projects of one customer (nothing is offered before a customer is chosen)
export async function searchProjects(q: string, customerId: string | undefined): Promise<LookupItem[]> {
  if (!customerId || !isId(customerId)) return [];
  const text = q.trim();
  const rows = await prisma.project.findMany({
    where: { customerId, ...(text ? { name: contains(text) } : {}) },
    orderBy: { name: "asc" },
    take: LIMIT,
    select: { id: true, name: true, status: true, dealId: true },
  });
  return rows.map(p => ({ id: p.id, label: p.name, sub: p.status, tag: null }));
}

export async function searchCatalog(q: string, limit = LIMIT): Promise<ItemDto[]> {
  const text = q.trim();
  const rows = await prisma.catalogItem.findMany({
    where: { deletedAt: null, isActive: true, ...(text ? { OR: [{ name: contains(text) }, { description: contains(text) }, { hsn: contains(text) }] } : {}) },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: Math.min(200, limit),
  });
  return rows.map(toItem);
}

// ---------------------------------------------------------------------------
// A new customer from the quote form. The same phone or email is never added twice; the same name asks first.
// ---------------------------------------------------------------------------
export class DuplicateCustomerError extends Error {
  constructor(public existing: CustomerDto, public hard: boolean, message: string) {
    super(message);
  }
}

export type CustomerInput = { name?: unknown; phone?: unknown; email?: unknown; address?: unknown; gstin?: unknown; customerType?: unknown };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES = ["Individual", "Company", "Builder", "Architect", "Interior Designer", "Contractor"];

export async function createCustomer(ctx: AuthContext, input: CustomerInput, force = false): Promise<CustomerDto> {
  needQuoteWriter(ctx);
  const str = (v: unknown, max: number, what: string, required = false) => {
    if (v === undefined || v === null) v = "";
    if (typeof v !== "string") throw new ServiceError(400, `${what} must be text.`);
    const s = stripControl(v).replace(/[ \t]+/g, " ").trim();
    if (required && !s) throw new ServiceError(400, `${what} is required.`);
    if (s.length > max) throw new ServiceError(400, `${what} can be ${max} characters long at most.`);
    return s;
  };
  const name = str(input.name, 200, "The customer name", true);
  const phoneRaw = str(input.phone, 30, "The phone number");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) throw new ServiceError(400, "The phone number must have 7 to 15 digits.");
  const email = str(input.email, 200, "The email address").toLowerCase();
  if (email && !EMAIL.test(email)) throw new ServiceError(400, "The email address is not valid.");
  const gstin = str(input.gstin, 20, "The GSTIN").toUpperCase();
  if (gstin && !/^[0-9A-Z]{10,20}$/.test(gstin)) throw new ServiceError(400, "The GSTIN can have letters and digits only.");
  const type = input.customerType === undefined || input.customerType === "" ? "Individual" : String(input.customerType);
  if (!TYPES.includes(type)) throw new ServiceError(400, "Choose a customer type from the list.");

  if (phone) {
    // Older customers were typed with spaces and dashes: compare digits only
    const hit = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Customer" WHERE regexp_replace("phone", '[^0-9+]', '', 'g') = ${phone} LIMIT 1`;
    if (hit[0]) throw new DuplicateCustomerError((await getCustomer(hit[0].id))!, true, "A customer with this phone number already exists.");
  }
  if (email) {
    const hit = await prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: CUSTOMER_SELECT });
    if (hit) throw new DuplicateCustomerError(toCustomer(hit), true, "A customer with this email address already exists.");
  }
  if (!force) {
    const hit = await prisma.customer.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: CUSTOMER_SELECT });
    if (hit) throw new DuplicateCustomerError(toCustomer(hit), false, `A customer called "${hit.name}" already exists.`);
  }
  const created = await prisma.customer.create({
    data: { name, phone, email: email || null, address: str(input.address, 1000, "The address") || null, gstin: gstin || null, customerType: type },
    select: CUSTOMER_SELECT,
  });
  return toCustomer(created);
}
