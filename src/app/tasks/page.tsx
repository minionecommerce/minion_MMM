import { requirePageAccess } from "@/lib/auth";
import { getTasksData } from "@/services/tasks";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requirePageAccess(["tasks"]);
  const data = await getTasksData();
  return (
    <TasksClient
      initialTasks={JSON.parse(JSON.stringify(data.tasks))}
      employees={JSON.parse(JSON.stringify(data.employees))}
      projects={JSON.parse(JSON.stringify(data.projects))}
      landscapes={JSON.parse(JSON.stringify(data.landscapes))}
    />
  );
}

