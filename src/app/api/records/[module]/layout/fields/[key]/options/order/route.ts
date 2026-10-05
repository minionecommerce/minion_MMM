import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderFieldOptions } from "@/lib/records/layout";
import { moduleFrom } from "../../../../../../helpers";

type Params = { params: Promise<{ module: string; key: string }> };

const orderSchema = z.object({ orderedIds: z.array(z.string().max(64)).max(200) }).strict();

// PUT /api/records/<module>/layout/fields/:key/options/order — the order of a dropdown's choices (Super Admin)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key } = await params;
    const { orderedIds } = await readJson(request, orderSchema);
    return NextResponse.json(await reorderFieldOptions(ctx, def.id, key, orderedIds));
  });
}
