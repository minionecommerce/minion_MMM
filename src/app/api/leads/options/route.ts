import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { getFormOptions } from "@/lib/leads/queries";

// GET /api/leads/options — dropdown values for the lead form (needs leads.view)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "leads", "view")) throw new ServiceError(403, "You do not have permission to view leads.");
    return NextResponse.json(await getFormOptions());
  });
}
