import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { completeCompanyFile } from "@/lib/quotes/settings-files";

type Params = { params: Promise<{ id: string }> };

// PUT /api/quotes/settings/files/:id — step 2: checks what Storage holds and marks the picture ready. Super Admin only.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json({ file: await completeCompanyFile(ctx, (await params).id) }));
}
