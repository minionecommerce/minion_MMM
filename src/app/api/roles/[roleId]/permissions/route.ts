import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { setRolePermissions } from "@/lib/users/service";
import { rolePermissionsSchema } from "@/lib/users/schemas";

// PUT /api/roles/:roleId/permissions — body { permissions: ["leads.view", ...] }; requires users.edit
export async function PUT(request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { roleId } = await params;
    const { permissions } = await readJson(request, rolePermissionsSchema);
    await setRolePermissions(ctx, roleId, permissions);
    return NextResponse.json({ success: true });
  });
}
