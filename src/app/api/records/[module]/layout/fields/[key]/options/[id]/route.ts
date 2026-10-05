import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { LayoutInUseError, deleteFieldOption, renameFieldOption } from "@/lib/records/layout";
import { layoutInUse, moduleFrom } from "../../../../../../helpers";

type Params = { params: Promise<{ module: string; key: string; id: string }> };

const patchSchema = z.object({ name: z.string().max(300) }).strict();

// PATCH /api/records/<module>/layout/fields/:key/options/:id — rename a choice (records keep pointing at it) (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key, id } = await params;
    const { name } = await readJson(request, patchSchema);
    await renameFieldOption(ctx, def.id, key, id, name);
    return NextResponse.json({ ok: true });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/records/<module>/layout/fields/:key/options/:id — { confirm: true } is required when records use the choice (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key, id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json(await deleteFieldOption(ctx, def.id, key, id, !!body.confirm));
    } catch (err) {
      if (err instanceof LayoutInUseError) return layoutInUse(err);
      throw err;
    }
  });
}
