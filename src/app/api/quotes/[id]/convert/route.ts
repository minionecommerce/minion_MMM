import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { convertQuote } from "@/lib/quotes/service";

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ target: z.string().min(1).max(30) }).strict();

// POST /api/quotes/:id/convert { target: "invoice" | "salesOrder" } — Convert. Needs edit.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { target } = await readJson(request, schema);
    return NextResponse.json(await convertQuote(ctx, id, target));
  });
}
