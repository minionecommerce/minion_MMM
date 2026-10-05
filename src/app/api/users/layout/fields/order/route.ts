import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderUserFields } from "@/lib/users/layout";

const schema = z.object({ orderedKeys: z.array(z.string().max(40)).min(1).max(30) }).strict();

// PUT /api/users/layout/fields/order — new order of the form fields (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { orderedKeys } = await readJson(request, schema);
    return NextResponse.json(await reorderUserFields(ctx, orderedKeys));
  });
}
