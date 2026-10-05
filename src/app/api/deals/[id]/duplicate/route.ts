import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { duplicateDeal } from "@/lib/deals/service";

// POST /api/deals/:id/duplicate — requires deals.create. A new deal (new Deal ID) with a new lead behind it; files and follow-ups are not copied
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const copy = await duplicateDeal(ctx, id);
    return NextResponse.json({ deal: { id: copy.dealId, code: copy.dealNumber, leadCode: copy.leadCode } }, { status: 201 });
  });
}
