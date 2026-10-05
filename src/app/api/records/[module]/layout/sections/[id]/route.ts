import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { deleteSection, renameSection } from "@/lib/records/layout";
import { moduleFrom } from "../../../../helpers";

type Params = { params: Promise<{ module: string; id: string }> };

const patchSchema = z.object({ label: z.string().max(200) }).strict();

// PATCH /api/records/<module>/layout/sections/:id — rename a section (Super Admin)
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { id } = await params;
    const { label } = await readJson(request, patchSchema);
    return NextResponse.json({ layout: await renameSection(ctx, def.id, id, label) });
  });
}

// DELETE /api/records/<module>/layout/sections/:id — a section added with New Section; its fields move to the first section (Super Admin)
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { id } = await params;
    return NextResponse.json(await deleteSection(ctx, def.id, id));
  });
}
