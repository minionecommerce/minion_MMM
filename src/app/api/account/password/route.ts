import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { changeOwnPassword } from "@/lib/users/service";
import { changePasswordSchema } from "@/lib/users/schemas";

// POST /api/account/password — signed-in user changes their own password.
// All sessions (including this one) end; the client signs in again.
export async function POST(request: Request) {
  return withAuthRoute(
    request,
    async ctx => {
      const { currentPassword, newPassword } = await readJson(request, changePasswordSchema);
      await changeOwnPassword(ctx, currentPassword, newPassword);
      return NextResponse.json({ success: true });
    },
    { allowPasswordChange: true }
  );
}
