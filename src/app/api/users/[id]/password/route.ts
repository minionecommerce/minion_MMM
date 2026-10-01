import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { resetUserPassword } from "@/lib/users/service";
import { resetPasswordSchema } from "@/lib/users/schemas";

// POST /api/users/:id/password — admin reset; requires users.edit.
// Returns the temporary password once; the user must change it at next sign-in.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { password } = await readJson(request, resetPasswordSchema);
    const temporaryPassword = await resetUserPassword(ctx, id, password || undefined);
    return NextResponse.json({ temporaryPassword });
  });
}
