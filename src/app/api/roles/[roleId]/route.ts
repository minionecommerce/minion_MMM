import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteRole, updateRole } from "@/lib/users/service";
import { updateRoleSchema } from "@/lib/users/schemas";

type Params = { params: Promise<{ roleId: string }> };

// PATCH /api/roles/:roleId — requires users.edit
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { roleId } = await params;
    const role = await updateRole(ctx, roleId, await readJson(request, updateRoleSchema));
    return NextResponse.json({ role: { id: role.id, name: role.name, isActive: role.isActive } });
  });
}

// DELETE /api/roles/:roleId — requires users.edit; only unassigned, non-system roles
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { roleId } = await params;
    await deleteRole(ctx, roleId);
    return NextResponse.json({ success: true });
  });
}
