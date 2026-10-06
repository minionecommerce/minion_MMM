import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { isRealDay, todayDay } from "@/lib/leads/format";
import { needQuotes } from "@/lib/quotes/access";
import { peekNumber, setNextNumber } from "@/lib/quotes/numbering-server";
import { loadSettings } from "@/lib/quotes/settings";

const today = () => todayDay();
const schema = z.object({ next: z.number().int(), date: z.string().max(10).optional() }).strict();

// GET /api/quotes/settings/numbering?date=YYYY-MM-DD — what the next quote of that day will be called. Needs view.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needQuotes(ctx, "view");
    const d = new URL(request.url).searchParams.get("date");
    const day = d && isRealDay(d) ? d : today();
    return NextResponse.json(await peekNumber((await loadSettings()).numbering, day));
  });
}

// PUT /api/quotes/settings/numbering { next, date } — "the next quote of this series is number N". Super Admin only.
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { next, date } = await readJson(request, schema);
    const day = date && isRealDay(date) ? date : today();
    return NextResponse.json(await setNextNumber(ctx, (await loadSettings()).numbering, day, next));
  });
}
