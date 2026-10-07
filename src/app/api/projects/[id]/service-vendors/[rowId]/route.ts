import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateServiceRow } from "@/lib/projects/rows";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; rowId: string }> };

// PUT /api/projects/:id/service-vendors/:rowId — requires projects.edit. Service Vendor Involvement: the typed columns of one row
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, rowId } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateServiceRow(ctx, id, rowId, values) });
  });
}
