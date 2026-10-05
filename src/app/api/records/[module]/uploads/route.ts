import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { signUpload } from "@/lib/records/files";
import { moduleFrom } from "../../helpers";

type Params = { params: Promise<{ module: string }> };

const signSchema = z.object({
  fieldKey: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.string().max(150),
  size: z.number().int().min(1).max(100 * 1024 * 1024),
}).strict();

// POST /api/records/<module>/uploads — step 1 of a file upload: checks the file and returns a signed Storage URL.
// The browser sends the bytes straight to Storage, then calls PUT .../uploads/:id. Needs create or edit.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    return NextResponse.json(await signUpload(ctx, def.id, await readJson(request, signSchema)));
  });
}
