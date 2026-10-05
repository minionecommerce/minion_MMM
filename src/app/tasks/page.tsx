import { can, requirePageAccess } from "@/lib/auth";
import { parseTaskParams } from "@/lib/tasks/rules";
import { getTaskOptions, listTasks } from "@/lib/tasks/service";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["tasks"]);
  const params = parseTaskParams(await searchParams);
  // Only the 50 tasks of the selected page are loaded, already filtered by type, status, search, dates and who the user may see
  const [data, options] = await Promise.all([listTasks(ctx, params), getTaskOptions(ctx)]);
  return <TasksClient data={data} params={params} options={options} canCreate={can(ctx, "tasks", "create")} currentUserName={ctx.name ?? "Me"} />;
}
