import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { sendQuote } from "@/lib/quotes/service";
import { originOf } from "../../helpers";

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ channel: z.enum(["email", "whatsapp", "link"]), to: z.string().max(200).optional() }).strict();

// POST /api/quotes/:id/send { channel, to } — creates the share link, marks the quote Sent and records how it went out. Needs edit.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, schema);
    return NextResponse.json(await sendQuote(ctx, id, originOf(request), body));
  });
}
