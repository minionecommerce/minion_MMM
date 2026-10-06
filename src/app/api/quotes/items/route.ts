import { NextResponse } from "next/server";
import { withAuthRoute, readJson } from "@/lib/api";
import { z } from "zod";
import { needQuoteWriter } from "@/lib/quotes/access";
import { createItem, listItems } from "@/lib/quotes/catalog";
import { searchCatalog } from "@/lib/quotes/lookups";
import { stripControl } from "@/lib/records/values";

const bodySchema = z.object({
  name: z.unknown(), description: z.unknown().optional(), hsn: z.unknown().optional(), unit: z.unknown().optional(), rate: z.unknown().optional(),
  taxId: z.unknown().optional(), kind: z.unknown().optional(), isActive: z.unknown().optional(),
}).strict();

// GET /api/quotes/items?q=&page=&active=all|active|inactive — the catalogue page. With picker=1: the first 30 matches for the item picker
// of a quote (needs create or edit).
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const sp = new URL(request.url).searchParams;
    const q = stripControl(sp.get("q") ?? "").trim().slice(0, 100);
    if (sp.get("picker") === "1") {
      needQuoteWriter(ctx);
      return NextResponse.json({ items: await searchCatalog(q, Math.min(200, parseInt(sp.get("limit") ?? "30", 10) || 30)) });
    }
    const active = sp.get("active");
    return NextResponse.json(await listItems(ctx, { q: q || undefined, page: Math.max(1, Math.min(100000, parseInt(sp.get("page") ?? "1", 10) || 1)), active: active === "active" || active === "inactive" ? active : "all" }));
  });
}

// POST /api/quotes/items — add an item. Needs create.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json({ item: await createItem(ctx, await readJson(request, bodySchema)) }, { status: 201 }));
}
