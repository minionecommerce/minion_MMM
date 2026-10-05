import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { LayoutInUseError, deleteField, updateField } from "@/lib/records/layout";
import { layoutInUse, moduleFrom } from "../../../../helpers";

type Params = { params: Promise<{ module: string; key: string }> };

const patchSchema = z.object({
  label: z.string().max(200).optional(),
  required: z.boolean().optional(),
  enabled: z.boolean().optional(),
  defaultValue: z.string().max(5000).nullable().optional(),
  section: z.string().max(64).optional(),
  type: z.string().max(20).optional(),
  currency: z.string().max(5).optional(),
  maxFiles: z.number().int().min(1).max(10).optional(),
  inList: z.boolean().optional(),
}).strict();

// PATCH /api/records/<module>/layout/fields/:key — label, mandatory, shown / hidden, default, section, type, list column (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key } = await params;
    return NextResponse.json({ layout: await updateField(ctx, def.id, key, await readJson(request, patchSchema)) });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/records/<module>/layout/fields/:key — fields added with New Field only; { confirm: true } when records have a value (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json(await deleteField(ctx, def.id, key, !!body.confirm));
    } catch (err) {
      if (err instanceof LayoutInUseError) return layoutInUse(err);
      throw err;
    }
  });
}
