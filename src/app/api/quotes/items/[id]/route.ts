import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteItem, updateItem } from "@/lib/quotes/catalog";

type Params = { params: Promise<{ id: string }> };
const bodySchema = z.object({
  name: z.unknown().optional(), description: z.unknown().optional(), hsn: z.unknown().optional(), unit: z.unknown().optional(), rate: z.unknown().optional(),
  taxId: z.unknown().optional(), kind: z.unknown().optional(), isActive: z.unknown().optional(),
}).strict();

// PUT /api/quotes/items/:id — edit an item (or switch it off). Needs edit.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json({ item: await updateItem(ctx, (await params).id, await readJson(request, bodySchema)) }));
}

// DELETE /api/quotes/items/:id — delete an item (quotes keep their own copy). Needs delete.
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json(await deleteItem(ctx, (await params).id)));
}
