import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { needQuoteWriter } from "@/lib/quotes/access";
import { createCustomer, DuplicateCustomerError, getCustomer, searchCustomers } from "@/lib/quotes/lookups";
import { stripControl } from "@/lib/records/values";
import { duplicateCustomer } from "../helpers";

const schema = z.object({
  name: z.unknown(), phone: z.unknown().optional(), email: z.unknown().optional(), address: z.unknown().optional(), gstin: z.unknown().optional(),
  customerType: z.unknown().optional(), force: z.boolean().optional(),
}).strict();

// GET /api/quotes/customers?q= (or ?id=) — customers to pick on a quote (with the address and GSTIN to fill the document). Needs create or edit.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needQuoteWriter(ctx);
    const sp = new URL(request.url).searchParams;
    const id = sp.get("id");
    if (id) {
      const one = await getCustomer(id);
      return NextResponse.json({ items: one ? [{ id: one.id, label: one.name, sub: null, tag: null, customer: one }] : [] });
    }
    const q = stripControl(sp.get("q") ?? "").slice(0, 100);
    return NextResponse.json({ items: await searchCustomers(q) });
  });
}

// POST /api/quotes/customers — a new customer. The same phone or email is refused (409 DUPLICATE with the customer that has it);
// the same name asks first (send force: true to add it anyway).
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { force, ...input } = await readJson(request, schema);
    try {
      return NextResponse.json({ customer: await createCustomer(ctx, input, force === true) }, { status: 201 });
    } catch (e) {
      if (e instanceof DuplicateCustomerError) return duplicateCustomer(e);
      throw e;
    }
  });
}
