import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { quotesOfDeal } from "@/lib/projects/quotes";

type Params = { params: Promise<{ id: string }> };

// GET /api/deals/:id/quotes — requires deals.view. The quotes of this deal only (never another deal's), with their items, for the Convert to Project popup.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ quotes: await quotesOfDeal(ctx, id) });
  });
}
