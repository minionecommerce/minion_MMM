import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { LayoutInUseError, deleteField, updateField } from "@/lib/leads/layout";
import { inUseResponse } from "../../helpers";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  label: z.string().max(200).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().max(5000).nullable().optional(),
}).strict();

// PATCH /api/leads/layout/fields/:id — label, required, default value (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, patchSchema);
    return NextResponse.json({ field: await updateField(ctx, id, body) });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/leads/layout/fields/:id — custom fields only; { confirm: true } when leads have a value (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json(await deleteField(ctx, id, !!body.confirm));
    } catch (err) {
      if (err instanceof LayoutInUseError) return inUseResponse(err);
      throw err;
    }
  });
}
