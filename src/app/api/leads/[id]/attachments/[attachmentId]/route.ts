import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { removeAttachment } from "@/lib/leads/service";

// DELETE /api/leads/:id/attachments/:attachmentId — requires leads.edit
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id, attachmentId } = await params;
    await removeAttachment(ctx, id, attachmentId);
    return NextResponse.json({ success: true });
  });
}
