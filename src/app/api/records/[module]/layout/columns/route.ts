import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { setColumns } from "@/lib/records/layout";
import { moduleFrom } from "../../../helpers";

type Params = { params: Promise<{ module: string }> };

const columnsSchema = z.object({ order: z.array(z.string().max(64)).max(200) }).strict();

// PUT /api/records/<module>/layout/columns — the order of the list page's columns (Super Admin)
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { order } = await readJson(request, columnsSchema);
    return NextResponse.json({ layout: await setColumns(ctx, def.id, order) });
  });
}
