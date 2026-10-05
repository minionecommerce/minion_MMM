import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { setUserColumnOrder } from "@/lib/users/layout";

const schema = z.object({ order: z.array(z.string().max(32)).min(1).max(30) }).strict();

// PUT /api/users/layout/columns — new order of the Users table columns (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { order } = await readJson(request, schema);
    return NextResponse.json(await setUserColumnOrder(ctx, order));
  });
}
