import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { followUpCompleteSchema, followUpSchema } from "@/lib/leads/schemas";
import { finishFollowUp, startFollowUp } from "@/lib/leads/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/leads/:id/follow-ups — step 1: validate, record the follow-up, return signed upload URLs for the proof files
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await startFollowUp(ctx, id, await readJson(request, followUpSchema)));
  });
}

// PUT /api/leads/:id/follow-ups — step 2: after the browser uploaded, verify the files and count the follow-up
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { followUpId } = await readJson(request, followUpCompleteSchema);
    return NextResponse.json(await finishFollowUp(ctx, id, followUpId));
  });
}
