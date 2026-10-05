import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { leadFieldSchema } from "@/lib/leads/schemas";
import { updateLeadField } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

// PATCH /api/deals/:id/field — requires deals.edit. Inline edit in the Deals table: Amount (the Deal Value), Deal Status
// (sent as "leadStatusId", the name the shared table cell uses), Location or Exact Location.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "edit");
    await updateLeadField(ctx, leadId, await readJson(request, leadFieldSchema), "deal");
    return NextResponse.json({ success: true });
  });
}
