import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { attachmentCompleteSchema, attachmentSignSchema } from "@/lib/leads/schemas";
import { completeAttachmentUploads, signAttachmentUploads } from "@/lib/leads/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/leads/:id/attachments — step 1: validate file list, return signed upload URLs
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { files } = await readJson(request, attachmentSignSchema);
    return NextResponse.json(await signAttachmentUploads(ctx, id, files));
  });
}

// PUT /api/leads/:id/attachments — step 2: after the browser uploaded, verify and mark READY
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { ids } = await readJson(request, attachmentCompleteSchema);
    return NextResponse.json({ results: await completeAttachmentUploads(ctx, id, ids) });
  });
}
