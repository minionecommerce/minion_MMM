import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { getNumbering, setNextCustomerNumber } from "@/lib/customers/service";
import { needCustomerReader } from "@/lib/customers/access";

// GET /api/customers/numbering — how customer numbers look (CUS-00001) and which one is next
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    needCustomerReader(ctx);
    return NextResponse.json(await getNumbering());
  });
}

const putSchema = z.object({ next: z.number() }).strict();

// PUT /api/customers/numbering — the gear next to Customer Number: { next } is the number the next customer gets (Super Admin)
export async function PUT(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { next } = await readJson(request, putSchema);
    return NextResponse.json(await setNextCustomerNumber(ctx, next));
  });
}
