import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { convertDealToProject } from "@/lib/projects/convert";
import { convertSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string }> };

// POST /api/deals/:id/convert-to-project — requires deals.edit and projects.create. Makes the project (MP1, MP2 ...) from the deal; the deal is kept and
// moves to the Converted Deals filter.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await convertDealToProject(ctx, id, await readJson(request, convertSchema)));
  });
}
