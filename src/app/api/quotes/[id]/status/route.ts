import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { setQuoteStatus } from "@/lib/quotes/service";

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.string().min(1).max(30) }).strict();

// POST /api/quotes/:id/status { status } — Mark as Sent (from Draft), Accepted or Declined (from Sent; Accepted and Declined switch). Needs edit.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { status } = await readJson(request, schema);
    return NextResponse.json(await setQuoteStatus(ctx, id, status));
  });
}
