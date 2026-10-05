import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { taskInputSchema } from "@/lib/tasks/schemas";
import { createTask } from "@/lib/tasks/service";

// POST /api/tasks — requires tasks.create
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json(await createTask(ctx, await readJson(request, taskInputSchema)), { status: 201 }));
}
