import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { assertSuperAdmin, getListSummaries } from "@/lib/dropdowns/service";

// GET /api/dropdowns — every managed list with its option count (Super Admin)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    assertSuperAdmin(ctx);
    return NextResponse.json({ counts: await getListSummaries() });
  });
}
