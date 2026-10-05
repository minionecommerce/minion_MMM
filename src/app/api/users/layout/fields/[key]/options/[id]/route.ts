import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteFieldOption, renameFieldOption } from "@/lib/users/custom-fields";
import { deleteAccessLevel, renameAccessLevel, setAccessLevelRole } from "@/lib/users/access";
import { ServiceError } from "@/lib/users/service";

type Params = { params: Promise<{ key: string; id: string }> };

// name: rename the choice. roleId (Access only): the role this access level gives; confirm is needed when people are on it.
const patchSchema = z.object({
  name: z.string().max(300).optional(),
  roleId: z.string().min(1).max(64).optional(),
  confirm: z.boolean().optional(),
}).strict();

// PATCH /api/users/layout/fields/:key/options/:id — rename a choice / change the role of an access level (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key, id } = await params;
    const body = await readJson(request, patchSchema);
    if (body.name === undefined && body.roleId === undefined) throw new ServiceError(400, "Nothing to change.");
    if (key === "access") {
      if (body.name !== undefined) await renameAccessLevel(ctx, id, body.name);
      if (body.roleId !== undefined) await setAccessLevelRole(ctx, id, body.roleId, !!body.confirm);
    } else {
      if (body.roleId !== undefined) throw new ServiceError(400, "Only the Access field links its options to roles.");
      await renameFieldOption(ctx, key, id, body.name!);
    }
    return NextResponse.json({ success: true });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/users/layout/fields/:key/options/:id — { confirm: true } when people have chosen it (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key, id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    if (key === "access") return NextResponse.json(await deleteAccessLevel(ctx, id, !!body.confirm));
    return NextResponse.json(await deleteFieldOption(ctx, key, id, !!body.confirm));
  });
}
