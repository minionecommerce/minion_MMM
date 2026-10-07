import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateMaterialRow } from "@/lib/projects/rows";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; rowId: string }> };

// PUT /api/projects/:id/material-vendors/:rowId — requires projects.edit. Material Vendor Involvement: the typed columns of one row
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, rowId } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateMaterialRow(ctx, id, rowId, values) });
  });
}
