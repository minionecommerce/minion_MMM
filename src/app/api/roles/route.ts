import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { createRole } from "@/lib/users/service";
import { createRoleSchema } from "@/lib/users/schemas";

// POST /api/roles — requires users.edit
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const role = await createRole(ctx, await readJson(request, createRoleSchema));
    return NextResponse.json({ role: { id: role.id, name: role.name } }, { status: 201 });
  });
}
