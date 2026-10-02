import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { reorderOptions } from "@/lib/dropdowns/service";

const schema = z.object({ orderedIds: z.array(z.string().max(64)).min(1).max(500) }).strict();

// PUT /api/dropdowns/:key/order — save a new order (Super Admin)
export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const { orderedIds } = await readJson(request, schema);
    return NextResponse.json(await reorderOptions(ctx, key, orderedIds));
  });
}
