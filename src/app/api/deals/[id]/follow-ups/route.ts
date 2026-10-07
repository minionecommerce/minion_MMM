import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { followUpCompleteSchema, followUpSchema } from "@/lib/leads/schemas";
import { finishFollowUp, listLeadFollowUps, startFollowUp } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

type Params = { params: Promise<{ id: string }> };

// GET /api/deals/:id/follow-ups — requires deals.view: the follow-ups (oldest first, the ones made while it was a lead included) with signed links to their proof files
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await listLeadFollowUps(ctx, await leadIdOf(ctx, id, "view", { allowConverted: true }), "deal")); // a converted deal's follow-ups can still be read
  });
}

// POST /api/deals/:id/follow-ups — step 1: validate, record the follow-up, return signed upload URLs for the proof files
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "view"); // who may add follow-ups is decided by startFollowUp
    return NextResponse.json(await startFollowUp(ctx, leadId, await readJson(request, followUpSchema), "deal"));
  });
}

// PUT /api/deals/:id/follow-ups — step 2: after the browser uploaded, verify the files and count the follow-up
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "view");
    const { followUpId } = await readJson(request, followUpCompleteSchema);
    return NextResponse.json(await finishFollowUp(ctx, leadId, followUpId, "deal"));
  });
}
