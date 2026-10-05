import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { addFieldOption, listFieldOptions } from "@/lib/users/custom-fields";
import { addAccessLevel, listAccessLevels } from "@/lib/users/access";
import { ServiceError } from "@/lib/users/service";

type Params = { params: Promise<{ key: string }> };

// GET /api/users/layout/fields/:key/options — the choices of a dropdown with the number of people who chose each (Super Admin).
// For the Access field (key "access") these are the access levels, Super Admin first, plus the roles a level can give.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    if (key === "access") return NextResponse.json(await listAccessLevels(ctx));
    return NextResponse.json({ options: await listFieldOptions(ctx, key) });
  });
}

const createSchema = z.object({ name: z.string().max(300), roleId: z.string().min(1).max(64).optional() }).strict();

// POST /api/users/layout/fields/:key/options — add a choice (Super Admin); for Access an optional roleId says which role it gives
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { key } = await params;
    const { name, roleId } = await readJson(request, createSchema);
    if (key === "access") return NextResponse.json({ option: await addAccessLevel(ctx, name, roleId) }, { status: 201 });
    if (roleId) throw new ServiceError(400, "Only the Access field links its options to roles.");
    return NextResponse.json({ option: await addFieldOption(ctx, key, name) }, { status: 201 });
  });
}
