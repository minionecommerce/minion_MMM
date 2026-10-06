import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { createField } from "@/lib/records/layout";
import { moduleFrom } from "../../../helpers";

type Params = { params: Promise<{ module: string }> };

const createSchema = z.object({
  label: z.string().max(200),
  type: z.string().max(20),
  section: z.string().max(64).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().max(5000).nullable().optional(),
  // A dropdown is created together with its options (names, in order); defaultOption is the position of its default
  options: z.array(z.string().max(300)).max(200).optional(),
  defaultOption: z.number().int().min(0).max(199).nullable().optional(),
  currency: z.string().max(5).optional(),
  maxFiles: z.number().int().min(1).max(10).optional(),
  inList: z.boolean().optional(),
  lookup: z.string().max(30).optional(), // a lookup field: which list it shows (customers, projects, deals, vendors, items, taxes)
}).strict();

// POST /api/records/<module>/layout/fields — New Field (Super Admin)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    return NextResponse.json(await createField(ctx, def.id, await readJson(request, createSchema)), { status: 201 });
  });
}
