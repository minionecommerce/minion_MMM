import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { getLayout } from "@/lib/leads/layout";

// GET /api/leads/layout — how every field on the lead form is set up (needs leads.view)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "leads", "view")) throw new ServiceError(403, "You do not have permission to view leads.");
    return NextResponse.json({ fields: await getLayout() });
  });
}
