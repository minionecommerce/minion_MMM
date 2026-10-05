import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { dealInputSchema } from "@/lib/leads/schemas";
import { deleteDeal, getDealDetail, updateDeal } from "@/lib/deals/service";

type Params = { params: Promise<{ id: string }> };

// GET /api/deals/:id — requires deals.view (includes short-lived signed links for the original lead's files)
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await getDealDetail(ctx, id));
  });
}

// PUT /api/deals/:id — requires deals.edit. The lead form plus Deal Name, Closing Date, Deal Value and Deal Status
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ success: true, ...(await updateDeal(ctx, id, await readJson(request, dealInputSchema))) });
  });
}

// DELETE /api/deals/:id — requires deals.delete (soft delete of the deal and the lead behind it)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await deleteDeal(ctx, id);
    return NextResponse.json({ success: true });
  });
}
