import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { createRecord, listRecords, parseListParams } from "@/lib/records/service";
import { genericModuleFrom as moduleFrom } from "../helpers";

type Params = { params: Promise<{ module: string }> };

// GET /api/records/<module> — the list page's data. Requires view on the module's permission.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const sp = parseListParams(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listRecords(ctx, def.id, sp));
  });
}

const recordBodySchema = z.object({
  values: z.record(z.string().max(64), z.unknown()).optional(),
  rows: z.record(z.string().max(64), z.array(z.unknown()).max(500)).optional(),
}).strict();

// POST /api/records/<module> — create a record (values by field key, rows by table section). Requires create.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const created = await createRecord(ctx, def.id, await readJson(request, recordBodySchema));
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  });
}
