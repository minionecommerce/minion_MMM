import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { cloneQuote } from "@/lib/quotes/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/quotes/:id/clone — a copy of the quote as a new Draft. Needs create.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await cloneQuote(ctx, id), { status: 201 });
  });
}
