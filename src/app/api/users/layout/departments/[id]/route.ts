import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteDepartmentOption, renameDepartmentOption } from "@/lib/users/departments";

type Params = { params: Promise<{ id: string }> };

const renameSchema = z.object({ name: z.string().max(300) }).strict();

// PATCH /api/users/layout/departments/:id — rename (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { name } = await readJson(request, renameSchema);
    await renameDepartmentOption(ctx, id, name);
    return NextResponse.json({ success: true });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/users/layout/departments/:id — { confirm: true } when people are in it (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    return NextResponse.json(await deleteDepartmentOption(ctx, id, !!body.confirm));
  });
}
