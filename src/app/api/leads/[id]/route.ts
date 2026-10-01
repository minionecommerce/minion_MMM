import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { leadInputSchema } from "@/lib/leads/schemas";
import { deleteLead, getLeadDetail, updateLead } from "@/lib/leads/service";

type Params = { params: Promise<{ id: string }> };

// GET /api/leads/:id — requires leads.view (includes short-lived signed links for attachments)
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await getLeadDetail(ctx, id));
  });
}

// PUT /api/leads/:id — requires leads.edit
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await updateLead(ctx, id, await readJson(request, leadInputSchema));
    return NextResponse.json({ success: true });
  });
}

// DELETE /api/leads/:id — requires leads.delete (soft delete)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await deleteLead(ctx, id);
    return NextResponse.json({ success: true });
  });
}
