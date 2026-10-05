import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { updateUserField } from "@/lib/users/layout";
import { deleteUserField } from "@/lib/users/custom-fields";

type Params = { params: Promise<{ key: string }> };

const patchSchema = z.object({
  label: z.string().max(200).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().max(200).nullable().optional(),
}).strict();

// PATCH /api/users/layout/fields/:key — label, required, default value (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const body = await readJson(request, patchSchema);
    return NextResponse.json({ fields: await updateUserField(ctx, key, body) });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/users/layout/fields/:key — fields added with New Field only; { confirm: true } when people have a value (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    return NextResponse.json(await deleteUserField(ctx, key, !!body.confirm));
  });
}
