import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { attachmentCompleteSchema, attachmentSignSchema } from "@/lib/leads/schemas";
import { completeAttachmentUploads, signAttachmentUploads } from "@/lib/leads/service";
import { leadIdOf } from "@/lib/deals/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/deals/:id/attachments — step 1: validate file list, return signed upload URLs (the files belong to the lead behind the deal)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "view"); // who may attach files is decided by signAttachmentUploads
    const { files } = await readJson(request, attachmentSignSchema);
    return NextResponse.json(await signAttachmentUploads(ctx, leadId, files, "deal"));
  });
}

// PUT /api/deals/:id/attachments — step 2: after the browser uploaded, verify and mark READY
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const leadId = await leadIdOf(ctx, id, "view");
    const { ids } = await readJson(request, attachmentCompleteSchema);
    return NextResponse.json({ results: await completeAttachmentUploads(ctx, leadId, ids, "deal") });
  });
}
