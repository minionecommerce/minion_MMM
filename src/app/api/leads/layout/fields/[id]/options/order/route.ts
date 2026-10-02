import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { reorderOptions } from "@/lib/leads/layout";

const schema = z.object({ orderedIds: z.array(z.string().max(64)).min(1).max(500) }).strict();

// PUT /api/leads/layout/fields/:id/options/order — new order of a pick list (Super Admin)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { orderedIds } = await readJson(request, schema);
    return NextResponse.json(await reorderOptions(ctx, id, orderedIds));
  });
}
