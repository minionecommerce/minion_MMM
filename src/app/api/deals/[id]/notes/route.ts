import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { notesSchema } from "@/lib/leads/schemas";
import { updateNotes } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

// PATCH /api/deals/:id/notes — requires deals.edit (inline "Click to add notes" under the Deal Status)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "edit");
    const { notes } = await readJson(request, notesSchema);
    await updateNotes(ctx, leadId, notes, "deal");
    return NextResponse.json({ success: true });
  });
}
