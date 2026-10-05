import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { taskEditSchema } from "@/lib/tasks/schemas";
import { completeTask, deleteTask, getTaskDetail, startTask, toggleStar, updateTask } from "@/lib/tasks/service";

type Params = { params: Promise<{ id: string }> };

// GET /api/tasks/:id — requires tasks.view, and the task must be one the user may see
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => NextResponse.json({ task: await getTaskDetail(ctx, (await params).id) }));
}

// PUT /api/tasks/:id — requires tasks.edit: edit the task's details
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    await updateTask(ctx, (await params).id, await readJson(request, taskEditSchema));
    return NextResponse.json({ success: true });
  });
}

const actionSchema = z.object({ action: z.enum(["start", "complete", "star"]) }).strict();

// PATCH /api/tasks/:id — requires tasks.edit: start, complete or star
export async function PATCH(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const { action } = await readJson(request, actionSchema);
    if (action === "start") await startTask(ctx, id);
    else if (action === "complete") await completeTask(ctx, id);
    else return NextResponse.json({ success: true, ...(await toggleStar(ctx, id)) });
    return NextResponse.json({ success: true });
  });
}

// DELETE /api/tasks/:id — requires tasks.delete
export async function DELETE(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    await deleteTask(ctx, (await params).id);
    return NextResponse.json({ success: true });
  });
}
