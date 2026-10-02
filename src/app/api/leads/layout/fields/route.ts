import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthRoute, readJson } from "@/lib/api";
import { createField } from "@/lib/leads/layout";

const schema = z.object({
  label: z.string().max(200),
  type: z.string().max(30),
  required: z.boolean().optional(),
  defaultValue: z.string().max(5000).nullish(),
}).strict();

// POST /api/leads/layout/fields — add a custom field (Super Admin)
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const body = await readJson(request, schema);
    return NextResponse.json({ field: await createField(ctx, body) }, { status: 201 });
  });
}
