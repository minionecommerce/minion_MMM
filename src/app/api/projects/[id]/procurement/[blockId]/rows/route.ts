import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { addProcurementRow } from "@/lib/projects/rows";

type Params = { params: Promise<{ id: string; blockId: string }> };

// POST /api/projects/:id/procurement/:blockId/rows — requires projects.edit. Add Row +: another empty row in the block, to type in
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, blockId } = await params;
    return NextResponse.json({ detail: await addProcurementRow(ctx, id, blockId) });
  });
}
