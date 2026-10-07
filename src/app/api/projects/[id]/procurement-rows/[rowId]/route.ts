import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteProcurementRow, updateProcurementRow } from "@/lib/projects/rows";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; rowId: string }> };

// PUT /api/projects/:id/procurement-rows/:rowId — requires projects.edit. The typed columns of one Material Procurement row
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, rowId } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateProcurementRow(ctx, id, rowId, values) });
  });
}

// DELETE /api/projects/:id/procurement-rows/:rowId — requires projects.edit
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, rowId } = await params;
    return NextResponse.json({ detail: await deleteProcurementRow(ctx, id, rowId) });
  });
}
