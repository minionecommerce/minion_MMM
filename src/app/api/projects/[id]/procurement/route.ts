import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { addProcurementBlock } from "@/lib/projects/rows";

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/:id/procurement — requires projects.edit. Add Material +: another Material Procurement block (it starts with one row)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ detail: await addProcurementBlock(ctx, id) });
  });
}
