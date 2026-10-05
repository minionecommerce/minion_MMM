import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { createUserField } from "@/lib/users/custom-fields";

const createSchema = z.object({
  label: z.string().max(200),
  type: z.string().max(20),
  required: z.boolean().optional(),
  defaultValue: z.string().max(5000).nullable().optional(),
  // A dropdown is created together with its options (names, in order); defaultOption is the position of its default
  options: z.array(z.string().max(300)).max(200).optional(),
  defaultOption: z.number().int().min(0).max(199).nullable().optional(),
}).strict();

// POST /api/users/layout/fields — New Field (Super Admin)
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const body = await readJson(request, createSchema);
    return NextResponse.json(await createUserField(ctx, body), { status: 201 });
  });
}
