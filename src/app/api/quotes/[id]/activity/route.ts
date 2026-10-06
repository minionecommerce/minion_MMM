import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { quoteActivity } from "@/lib/quotes/service";

type Params = { params: Promise<{ id: string }> };

// GET /api/quotes/:id/activity — the history of the quote, newest first. Needs view.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ items: await quoteActivity(ctx, id) });
  });
}
