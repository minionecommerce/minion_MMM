import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { setUserPermissions } from "@/lib/users/service";
import { permissionsSchema } from "@/lib/users/schemas";

// PUT /api/users/:id/permissions — replaces user-specific overrides; requires users.edit
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { overrides } = await readJson(request, permissionsSchema);
    await setUserPermissions(ctx, id, overrides);
    return NextResponse.json({ success: true });
  });
}
