import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { createShare, revokeShare } from "@/lib/quotes/service";
import { originOf } from "../../helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/quotes/:id/share — the share link of the quote (made if there is none that still works). Needs edit.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json({ share: await createShare(ctx, id, originOf(request)) });
  });
}

// DELETE /api/quotes/:id/share — switches the link off. Needs edit.
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await revokeShare(ctx, id));
  });
}
