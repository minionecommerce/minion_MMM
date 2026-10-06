import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { RecordInUseError, deleteRecord, getRecord, updateRecord } from "@/lib/records/service";
import { genericModuleFrom as moduleFrom, recordInUse } from "../../helpers";

type Params = { params: Promise<{ module: string; id: string }> };

const bodySchema = z.object({
  values: z.record(z.string().max(64), z.unknown()).optional(),
  rows: z.record(z.string().max(64), z.array(z.unknown()).max(500)).optional(),
}).strict();

// GET /api/records/<module>/:id — the record with its rows and files (short-lived links). Requires view.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { id } = await params;
    return NextResponse.json(await getRecord(ctx, def.id, id));
  });
}

// PUT /api/records/<module>/:id — save the fields and tables the form sent. Requires edit.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { id } = await params;
    const saved = await updateRecord(ctx, def.id, id, await readJson(request, bodySchema));
    return NextResponse.json({ success: true, ...saved });
  });
}

const deleteSchema = z.object({ confirm: z.boolean().optional() }).strict();

// DELETE /api/records/<module>/:id — soft delete; its ID is never reused. Requires delete.
// A vendor that payment records use answers 409 { code: "IN_USE" } until { confirm: true } is sent.
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const { id } = await params;
    const body = await readJson(request, deleteSchema).catch(() => ({ confirm: false }));
    try {
      return NextResponse.json({ success: true, ...(await deleteRecord(ctx, def.id, id, !!body.confirm)) });
    } catch (err) {
      if (err instanceof RecordInUseError) return recordInUse(err);
      throw err;
    }
  });
}
