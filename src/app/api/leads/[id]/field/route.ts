import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { leadFieldSchema } from "@/lib/leads/schemas";
import { updateLeadField } from "@/lib/leads/service";

// PATCH /api/leads/:id/field — requires leads.edit. Inline edit in the Leads table: Amount, Lead Status, Location or Exact Location.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await updateLeadField(ctx, id, await readJson(request, leadFieldSchema));
    return NextResponse.json({ success: true });
  });
}
