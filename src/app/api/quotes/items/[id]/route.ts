import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteItem, getItemDetail, updateItem } from "@/lib/quotes/catalog";
import { itemBodySchema } from "../../helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/quotes/items/:id — one item with everything the New Item form shows, pictures included. Needs view.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json({ item: await getItemDetail(ctx, (await params).id) }));
}

// PUT /api/quotes/items/:id — edit an item (or switch it off). Needs edit. The item is changed, never copied.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json({ item: await updateItem(ctx, (await params).id, await readJson(request, itemBodySchema)) }));
}

// DELETE /api/quotes/items/:id — delete an item (quotes keep their own copy). Needs delete.
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json(await deleteItem(ctx, (await params).id)));
}
