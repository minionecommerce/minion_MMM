import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { LayoutInUseError, deleteOption, renameOption } from "@/lib/leads/layout";
import { inUseResponse } from "../../helpers";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ label: z.string().max(300) }).strict();

// PATCH /api/leads/layout/options/:id — change an option's label (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { label } = await readJson(request, patchSchema);
    return NextResponse.json({ option: await renameOption(ctx, id, label) });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/leads/layout/options/:id — { confirm: true } is required when leads use the option (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json(await deleteOption(ctx, id, !!body.confirm));
    } catch (err) {
      if (err instanceof LayoutInUseError) return inUseResponse(err);
      throw err;
    }
  });
}
