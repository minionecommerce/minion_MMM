import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { createSection } from "@/lib/records/layout";
import { moduleFrom } from "../../../helpers";

type Params = { params: Promise<{ module: string }> };

const createSchema = z.object({ label: z.string().max(200) }).strict();

// POST /api/records/<module>/layout/sections — New Section (Super Admin)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { label } = await readJson(request, createSchema);
    return NextResponse.json({ layout: await createSection(ctx, def.id, label) }, { status: 201 });
  });
}
