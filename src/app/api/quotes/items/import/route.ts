import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { importItems } from "@/lib/quotes/catalog";

const schema = z.object({ csv: z.string().min(1).max(4_000_000) }).strict();

// POST /api/quotes/items/import { csv } — add or update items from a CSV file (a Zoho Books item export works). Needs create and edit.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json(await importItems(ctx, (await readJson(request, schema)).csv)));
}
