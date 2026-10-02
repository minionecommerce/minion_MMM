import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { assertSuperAdmin, createOption, getOptions, getOptionsWithUsage } from "@/lib/dropdowns/service";

type Params = { params: Promise<{ key: string }> };

// GET /api/dropdowns/:key — the options of one list.
// Any signed-in user (the forms need them). ?usage=1 adds record counts and is Super Admin only.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    if (new URL(request.url).searchParams.get("usage") === "1") {
      assertSuperAdmin(ctx);
      return NextResponse.json({ options: await getOptionsWithUsage(key) });
    }
    return NextResponse.json({ options: await getOptions(key) });
  });
}

const createSchema = z.object({
  label: z.string().max(200),
  parentId: z.string().max(64).nullish(),
  isDefault: z.boolean().optional(),
}).strict();

// POST /api/dropdowns/:key — add an option (Super Admin)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const body = await readJson(request, createSchema);
    return NextResponse.json({ option: await createOption(ctx, key, body) }, { status: 201 });
  });
}
