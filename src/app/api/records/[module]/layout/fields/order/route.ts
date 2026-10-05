import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderFields } from "@/lib/records/layout";
import { moduleFrom } from "../../../../helpers";

type Params = { params: Promise<{ module: string }> };

const orderSchema = z.object({ section: z.string().min(1).max(64), orderedKeys: z.array(z.string().max(64)).max(200) }).strict();

// PUT /api/records/<module>/layout/fields/order — the order of the fields of one section (Super Admin)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { section, orderedKeys } = await readJson(request, orderSchema);
    return NextResponse.json({ layout: await reorderFields(ctx, def.id, section, orderedKeys) });
  });
}
