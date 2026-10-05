import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { getUserLayout } from "@/lib/users/layout";

// GET /api/users/layout — how the user form fields and the Users table are set up (needs users.view)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "users", "view")) throw new ServiceError(403, "You do not have permission to view users.");
    return NextResponse.json(await getUserLayout());
  });
}
