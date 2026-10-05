import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { closeLeadCompleteSchema, closeLeadSchema } from "@/lib/leads/schemas";
import { finishLeadClosure, startLeadClosure } from "@/lib/leads/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/leads/:id/close — requires leads.edit. Step 1: validate the reason, record the closing, return signed upload URLs for the optional files
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await startLeadClosure(ctx, id, await readJson(request, closeLeadSchema)));
  });
}

// PUT /api/leads/:id/close — Step 2: after the browser uploaded, verify the files, then close the lead (Lead Status "Closed")
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { closureId } = await readJson(request, closeLeadCompleteSchema);
    return NextResponse.json(await finishLeadClosure(ctx, id, closureId));
  });
}
