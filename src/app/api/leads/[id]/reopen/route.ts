import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { reopenLead } from "@/lib/leads/service";

// POST /api/leads/:id/reopen — requires leads.edit. Opens a closed lead again (its Status goes back to Open); the closing stays in its history.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await reopenLead(ctx, id);
    return NextResponse.json({ success: true });
  });
}
