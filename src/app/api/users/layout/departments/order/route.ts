import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderDepartmentOptions } from "@/lib/users/departments";

const schema = z.object({ orderedIds: z.array(z.string().max(64)).min(1).max(500) }).strict();

// PUT /api/users/layout/departments/order — new order of the Department pick list (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { orderedIds } = await readJson(request, schema);
    return NextResponse.json(await reorderDepartmentOptions(ctx, orderedIds));
  });
}
