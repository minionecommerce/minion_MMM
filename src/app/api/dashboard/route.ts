import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { getDashboardMetrics, needDashboard } from "@/lib/dashboard/service";

// GET /api/dashboard?mode=today|monthly|total&month=2026-10&from=2026-10-01&to=2026-10-18 — the numbers of the signed-in person, for the chosen period
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needDashboard(ctx);
    const q = new URL(request.url).searchParams;
    return NextResponse.json(await getDashboardMetrics(ctx, { mode: q.get("mode"), month: q.get("month"), from: q.get("from"), to: q.get("to") }));
  });
}
