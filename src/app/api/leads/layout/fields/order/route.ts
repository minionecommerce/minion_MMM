import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { reorderFields } from "@/lib/leads/layout";

const schema = z.object({ orderedIds: z.array(z.string().max(64)).min(1).max(100) }).strict();

// PUT /api/leads/layout/fields/order — new order of the form fields (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { orderedIds } = await readJson(request, schema);
    return NextResponse.json(await reorderFields(ctx, orderedIds));
  });
}
