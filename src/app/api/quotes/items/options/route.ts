import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { ServiceError } from "@/lib/users/service";
import { OPTION_KINDS, itemOptions, type OptionKind } from "@/lib/quotes/catalog";
import { stripControl } from "@/lib/records/values";

// GET /api/quotes/items/options?kind=categories|units|accounts&q= — the pick-lists of the New Item form: what the catalogue already uses (and the
// standard choices), searchable. Needs create or edit.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const sp = new URL(request.url).searchParams;
    const kind = sp.get("kind");
    if (!OPTION_KINDS.includes(kind as OptionKind)) throw new ServiceError(400, "Unknown list");
    return NextResponse.json({ items: await itemOptions(ctx, kind as OptionKind, stripControl(sp.get("q") ?? "").slice(0, 100)) });
  });
}
