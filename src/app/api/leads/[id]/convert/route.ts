import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { convertLeadSchema } from "@/lib/leads/schemas";
import { convertLeadToDeal } from "@/lib/leads/service";

type Params = { params: Promise<{ id: string }> };

// POST /api/leads/:id/convert — requires leads.edit and deals.create. Turns the lead into a deal (DL1, DL2, ...); the Lead ID stays as it is
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    return NextResponse.json(await convertLeadToDeal(ctx, id, await readJson(request, convertLeadSchema)));
  });
}
