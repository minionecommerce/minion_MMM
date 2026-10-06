import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { signCompanyFile } from "@/lib/quotes/settings-files";

const schema = z.object({ kind: z.enum(["logo", "signature"]), name: z.string().min(1).max(255), size: z.number().int().min(1).max(20 * 1024 * 1024) }).strict();

// POST /api/quotes/settings/files { kind, name, size } — step 1 of uploading the company logo or signature: a signed Storage URL. Super Admin only.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json(await signCompanyFile(ctx, await readJson(request, schema))));
}
