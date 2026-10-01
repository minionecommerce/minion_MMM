import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { createUser } from "@/lib/users/service";
import { createUserSchema } from "@/lib/users/schemas";

// POST /api/users — requires users.create (checked in the service)
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const input = await readJson(request, createUserSchema);
    const user = await createUser(ctx, input);
    return NextResponse.json({ user }, { status: 201 });
  });
}
