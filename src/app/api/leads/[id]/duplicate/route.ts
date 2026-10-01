import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { duplicateLead } from "@/lib/leads/service";

// POST /api/leads/:id/duplicate — requires leads.create
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const lead = await duplicateLead(ctx, id);
    return NextResponse.json({ lead: { id: lead.id, code: lead.leadCode } }, { status: 201 });
  });
}
