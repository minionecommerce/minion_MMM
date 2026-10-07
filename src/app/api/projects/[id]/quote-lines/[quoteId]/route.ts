import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateQuoteLine } from "@/lib/projects/rows";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; quoteId: string }> };

// PUT /api/projects/:id/quote-lines/:quoteId — requires projects.edit. Project Value Information: the Exclusions of one accepted quote
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, quoteId } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateQuoteLine(ctx, id, quoteId, values) });
  });
}
