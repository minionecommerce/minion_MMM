import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { itemImageUrl } from "@/lib/quotes/catalog";

type Params = { params: Promise<{ fileId: string }> };

// GET /api/quotes/items/image/:fileId — a picture of an item: sends the browser to a short-lived link of the private Storage bucket.
// A quote row and the New Item form use it as the address of the picture. Needs view.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.redirect(await itemImageUrl(ctx, (await params).fileId), 302));
}
