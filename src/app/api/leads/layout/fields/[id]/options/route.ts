import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { assertSuperAdmin, createOption, getFieldOptions } from "@/lib/leads/layout";

type Params = { params: Promise<{ id: string }> };

// GET /api/leads/layout/fields/:id/options — options of a pick-list field with how many leads use each (Super Admin)
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    assertSuperAdmin(ctx);
    const { id } = await params;
    return NextResponse.json({ options: await getFieldOptions(id, true) });
  });
}

const schema = z.object({ label: z.string().max(300), parentId: z.string().max(64).nullish() }).strict();

// POST /api/leads/layout/fields/:id/options — add an option (Super Admin)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, schema);
    return NextResponse.json({ option: await createOption(ctx, id, body) }, { status: 201 });
  });
}
