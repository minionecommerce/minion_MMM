import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { addTaskTemplates, importPart, loadImportContext, MAX_PART_ROWS } from "@/lib/quotes/item-import-server";

const rows = z.array(z.object({
  line: z.number().int().min(1).max(1_000_000),
  values: z.record(z.string().max(200), z.string().max(60_000)).refine(v => Object.keys(v).length <= 300, "Too many columns."),
  updateId: z.string().max(60).nullable().optional(),
}).strict()).max(MAX_PART_ROWS);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rows"),
    rows,
    mapping: z.record(z.string().max(200), z.string().max(40)),
    mode: z.enum(["skip", "update"]),
  }).strict(),
  z.object({ action: z.literal("templates"), names: z.array(z.string().max(100)).max(100) }).strict(),
]);

// GET /api/quotes/items/import — what the Items page needs to preview a file: the taxes, the Task Templates and the items that are there. Needs create and edit.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json(await loadImportContext(ctx)));
}

// POST /api/quotes/items/import { action: "rows", rows, mapping, mode } — writes one part of the file (500 rows at most), returns what happened to each row.
// POST /api/quotes/items/import { action: "templates", names } — adds Task Templates that the Project template list does not have yet (Super Admin).
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const body = await readJson(request, schema);
    if (body.action === "templates") return NextResponse.json(await addTaskTemplates(ctx, body.names));
    return NextResponse.json({ results: await importPart(ctx, { rows: body.rows, mapping: body.mapping, mode: body.mode }) });
  });
}
