import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateItemSelection } from "@/lib/projects/rows";
import { selectionSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; itemId: string }> };

// PUT /api/projects/:id/items/:itemId — requires projects.edit. Vendor Selection: the Template ({ values: { templateId } }) and the Service /
// Material Vendors of one item of an accepted quote. The Involvement tables are brought in line with it.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, itemId } = await params;
    return NextResponse.json({ detail: await updateItemSelection(ctx, id, itemId, await readJson(request, selectionSchema)) });
  });
}
