import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderSections } from "@/lib/records/layout";
import { moduleFrom } from "../../../../helpers";

type Params = { params: Promise<{ module: string }> };

const orderSchema = z.object({ orderedIds: z.array(z.string().max(64)).max(30) }).strict();

// PUT /api/records/<module>/layout/sections/order — the order of the sections (Super Admin)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { orderedIds } = await readJson(request, orderSchema);
    return NextResponse.json({ layout: await reorderSections(ctx, def.id, orderedIds) });
  });
}
