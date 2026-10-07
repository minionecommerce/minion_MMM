import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateWorkCoverage } from "@/lib/projects/rows";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; templateId: string }> };

// PUT /api/projects/:id/work-coverage/:templateId — requires projects.edit. Work Coverage: the Completed tick of a template
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, templateId } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateWorkCoverage(ctx, id, templateId, values) });
  });
}
