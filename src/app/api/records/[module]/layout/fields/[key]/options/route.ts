import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { addFieldOption, listFieldOptions } from "@/lib/records/layout";
import { moduleFrom } from "../../../../../helpers";

type Params = { params: Promise<{ module: string; key: string }> };

// GET /api/records/<module>/layout/fields/:key/options — the choices of a dropdown, with how many records use each (Super Admin)
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key } = await params;
    return NextResponse.json({ options: await listFieldOptions(ctx, def.id, key) });
  });
}

const createSchema = z.object({ name: z.string().max(300) }).strict();

// POST /api/records/<module>/layout/fields/:key/options — add a choice (Super Admin)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { key } = await params;
    const { name } = await readJson(request, createSchema);
    return NextResponse.json(await addFieldOption(ctx, def.id, key, name), { status: 201 });
  });
}
