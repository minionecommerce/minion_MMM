import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { closeLeadCompleteSchema, closeLeadSchema } from "@/lib/leads/schemas";
import { finishLeadClosure, startLeadClosure } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/deals/:id/close — requires deals.edit. Step 1 of Close Deal: validate the reason, record the closing, return signed upload URLs for the optional files
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "edit");
    return NextResponse.json(await startLeadClosure(ctx, leadId, await readJson(request, closeLeadSchema), "deal"));
  });
}

// PUT /api/deals/:id/close — Step 2: after the browser uploaded, verify the files, then close the deal (its Status says Closed)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "edit");
    const { closureId } = await readJson(request, closeLeadCompleteSchema);
    return NextResponse.json(await finishLeadClosure(ctx, leadId, closureId, "deal"));
  });
}
