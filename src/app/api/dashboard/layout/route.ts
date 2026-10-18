import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { needDashboard } from "@/lib/dashboard/service";
import { saveDashboardLayout } from "@/lib/dashboard/layout";

const list = z.array(z.object({ key: z.string().max(40), visible: z.boolean() }).strict()).max(50);

// PUT /api/dashboard/layout — Edit Page Layout of My Dashboard (Super Admin only): the order of the sections, cards, charts and today lists, and which are shown
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    needDashboard(ctx);
    const body = await readJson(request, z.object({ sections: list, cards: list, charts: list, today: list }).strict());
    return NextResponse.json(await saveDashboardLayout(ctx, body));
  });
}
