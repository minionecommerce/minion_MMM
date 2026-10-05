import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { setDealColumnOrder } from "@/lib/leads/layout";

const schema = z.object({ order: z.array(z.string().max(32)).min(1).max(30) }).strict();

// PUT /api/deals/layout/columns — new order of the Deals table columns (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { order } = await readJson(request, schema);
    return NextResponse.json(await setDealColumnOrder(ctx, order));
  });
}
