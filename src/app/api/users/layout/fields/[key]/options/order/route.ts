import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { reorderFieldOptions } from "@/lib/users/custom-fields";
import { reorderAccessLevels } from "@/lib/users/access";

const schema = z.object({ orderedIds: z.array(z.string().max(64)).min(1).max(500) }).strict();

// PUT /api/users/layout/fields/:key/options/order — new order of the choices (Super Admin).
// For Access, list the access levels only: Super Admin always stays first.
export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const { orderedIds } = await readJson(request, schema);
    if (key === "access") return NextResponse.json(await reorderAccessLevels(ctx, orderedIds));
    return NextResponse.json(await reorderFieldOptions(ctx, key, orderedIds));
  });
}
