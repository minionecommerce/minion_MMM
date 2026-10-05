import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { completeUpload, discardUpload } from "@/lib/records/files";
import { moduleFrom } from "../../../helpers";

type Params = { params: Promise<{ module: string; fileId: string }> };

// PUT /api/records/<module>/uploads/:fileId — step 2: after the browser sent the bytes, check what Storage holds and mark it ready
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { fileId } = await params;
    return NextResponse.json({ file: await completeUpload(ctx, def.id, fileId) });
  });
}

// DELETE /api/records/<module>/uploads/:fileId — throw away an upload that was not attached to a record
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { fileId } = await params;
    await discardUpload(ctx, def.id, fileId);
    return NextResponse.json({ success: true });
  });
}
