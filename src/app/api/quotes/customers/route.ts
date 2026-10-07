import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { needQuoteWriter } from "@/lib/quotes/access";
import { getCustomer, searchCustomers } from "@/lib/quotes/lookups";
import { stripControl } from "@/lib/records/values";

// GET /api/quotes/customers?q= (or ?id=) — customers to pick on a quote (with the address, GSTIN and contact to fill the document). Needs create or edit.
// A customer is added and corrected with the Customer form: POST /api/customers and PUT /api/customers/:id.
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
