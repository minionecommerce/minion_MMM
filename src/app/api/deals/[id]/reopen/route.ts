import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { reopenLead } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

// POST /api/deals/:id/reopen — requires deals.edit. Revive Deal: opens a closed deal again; the closing stays in its history.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await reopenLead(ctx, await leadIdOf(ctx, id, "edit"), "deal");
    return NextResponse.json({ success: true });
  });
}
