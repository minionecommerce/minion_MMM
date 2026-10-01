import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { softDeleteUser, updateUser } from "@/lib/users/service";
import { updateUserSchema } from "@/lib/users/schemas";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/users/:id — requires users.edit
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await updateUser(ctx, id, await readJson(request, updateUserSchema));
    return NextResponse.json({ success: true });
  });
}

// DELETE /api/users/:id — requires users.delete (soft delete)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    await softDeleteUser(ctx, id);
    return NextResponse.json({ success: true });
  });
}
