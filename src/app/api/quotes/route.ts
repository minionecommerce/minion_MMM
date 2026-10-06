import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { createQuote, listQuotes, parseQuoteListParams } from "@/lib/quotes/service";
import type { QuoteBody } from "@/lib/quotes/types";
import { quoteBodySchema } from "./helpers";

// GET /api/quotes?q=&status=&sort=&dir=&page=&customer=&from=&to= — the list page's data. Needs view on quotes.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const sp = parseQuoteListParams(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listQuotes(ctx, sp));
  });
}

// POST /api/quotes — create a quote (Save as Draft / Save / Save and Send). Needs create.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const body = await readJson(request, quoteBodySchema);
    const created = await createQuote(ctx, body as unknown as QuoteBody);
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  });
}
