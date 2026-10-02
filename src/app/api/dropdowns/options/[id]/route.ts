import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { DropdownInUseError, deleteOption, updateOption } from "@/lib/dropdowns/service";

type Params = { params: Promise<{ id: string }> };

// The screen asks the Super Admin to confirm when an action touches existing records;
// 409 + { code: "IN_USE", usage } is how it finds out.
function inUse(err: DropdownInUseError) {
  return NextResponse.json({ error: err.message, code: "IN_USE", action: err.action, usage: err.usage }, { status: 409 });
}

const patchSchema = z.object({
  label: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
  applyToExistingRecords: z.boolean().optional(),
}).strict();

// PATCH /api/dropdowns/options/:id — change label / default (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, patchSchema);
    try {
      return NextResponse.json({ option: await updateOption(ctx, id, body) });
    } catch (err) {
      if (err instanceof DropdownInUseError) return inUse(err);
      throw err;
    }
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/dropdowns/options/:id — body { confirm: true } is required when records use the option (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json(await deleteOption(ctx, id, !!body.confirm));
    } catch (err) {
      if (err instanceof DropdownInUseError) return inUse(err);
      throw err;
    }
  });
}
