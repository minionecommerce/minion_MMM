import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { needDashboard } from "@/lib/dashboard/service";
import { getQuickActions, saveQuickActions } from "@/lib/dashboard/quick-actions";

// GET /api/dashboard/quick-actions — the actions the signed-in person may use, and the ones they chose
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needDashboard(ctx);
    return NextResponse.json(await getQuickActions(ctx));
  });
}

// PUT /api/dashboard/quick-actions { selected: ["add_lead", ...] } — saves the person's own choice (an action they may not use is refused)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    needDashboard(ctx);
    const body = await readJson(request, z.object({ selected: z.array(z.string().max(64)).max(50) }).strict());
    return NextResponse.json(await saveQuickActions(ctx, body.selected));
  });
}
