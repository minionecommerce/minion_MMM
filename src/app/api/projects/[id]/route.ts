import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { getProjectDetail } from "@/lib/projects/detail";
import { updateProjectValues } from "@/lib/projects/header";
import { valuesSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/:id — requires projects.view. The whole project as it is now (every number worked out again)
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ detail: await getProjectDetail(ctx, id) });
  });
}

// PUT /api/projects/:id — requires projects.edit. { values }: the Project Information and Exclusions / Incentive % fields that changed, by layout field key
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { values } = await readJson(request, valuesSchema);
    return NextResponse.json({ detail: await updateProjectValues(ctx, id, values) });
  });
}
