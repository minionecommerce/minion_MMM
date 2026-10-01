import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { setUserStatus } from "@/lib/users/service";
import { statusSchema } from "@/lib/users/schemas";

// POST /api/users/:id/status — requires users.edit
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { status } = await readJson(request, statusSchema);
    await setUserStatus(ctx, id, status);
    return NextResponse.json({ success: true });
  });
}
