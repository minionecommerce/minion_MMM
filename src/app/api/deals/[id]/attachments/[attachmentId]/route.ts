import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { removeAttachment } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

// DELETE /api/deals/:id/attachments/:attachmentId — requires deals.edit
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id, attachmentId } = await params;
    await removeAttachment(ctx, await leadIdOf(ctx, id, "edit"), attachmentId, "deal");
    return NextResponse.json({ success: true });
  });
}
