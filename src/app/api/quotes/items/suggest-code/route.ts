import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { ServiceError } from "@/lib/users/service";
import { needQuoteWriter } from "@/lib/quotes/access";
import { suggestCodes } from "@/lib/quotes/hsn-sac/match";
import { isItemKind } from "@/lib/quotes/item-constants";
import { stripControl } from "@/lib/records/values";

// GET /api/quotes/items/suggest-code?name=&kind=Goods|Service — the HSN code (Goods) or SAC (Service) that fits an item name: the one to put in the box,
// other codes worth a look, and the other kind when the name is clearly an item of that kind (see lib/quotes/hsn-sac). Needs create or edit, like the
// other lists of the New Item form. It reads the built-in code tables only; nothing is saved.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needQuoteWriter(ctx);
    const sp = new URL(request.url).searchParams;
    const kind = sp.get("kind");
    if (!isItemKind(kind)) throw new ServiceError(400, "Choose Goods or Service");
    const name = stripControl(sp.get("name") ?? "").trim().slice(0, 200);
    if (name.length < 2) return NextResponse.json({ best: null, others: [], switchTo: null });
    return NextResponse.json(suggestCodes(name, kind));
  });
}
