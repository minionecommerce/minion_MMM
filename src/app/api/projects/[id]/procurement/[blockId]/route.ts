import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteProcurementBlock, setProcurementItem } from "@/lib/projects/rows";
import { procurementItemSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; blockId: string }> };

// PUT /api/projects/:id/procurement/:blockId — requires projects.edit. The Item Name at the top of a block: an item of the accepted quotes (or null)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, blockId } = await params;
    const { quoteItemId } = await readJson(request, procurementItemSchema);
    return NextResponse.json({ detail: await setProcurementItem(ctx, id, blockId, quoteItemId) });
  });
}

// DELETE /api/projects/:id/procurement/:blockId — requires projects.edit. Removes the block with its rows and files
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, blockId } = await params;
    return NextResponse.json({ detail: await deleteProcurementBlock(ctx, id, blockId) });
  });
}
