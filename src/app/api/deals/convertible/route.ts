import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { ServiceError } from "@/lib/users/service";
import { hasPermission } from "@/lib/rbac/effective";
import { listDeals, parseDealParams } from "@/lib/deals/queries";

// GET /api/deals/convertible?q=... — the deals that can still be converted (not converted yet), for the New Project quick action. Needs deals.edit and projects.create.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "deals", "edit") || !hasPermission(ctx.permissions, "projects", "create")) throw new ServiceError(403, "You do not have permission to create projects from deals.");
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const { rows } = await listDeals(parseDealParams({ q }));
    return NextResponse.json({ deals: rows.filter(r => !r.isClosed) });
  });
}
