import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { notesSchema } from "@/lib/leads/schemas";
import { updateNotes } from "@/lib/leads/service";

// PATCH /api/leads/:id/notes — requires leads.edit (inline "Click to add notes")
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { notes } = await readJson(request, notesSchema);
    await updateNotes(ctx, id, notes);
    return NextResponse.json({ success: true });
  });
}
