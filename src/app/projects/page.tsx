import { requirePageAccess } from "@/lib/auth";
import { getProjects } from "@/services/projects";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requirePageAccess(["projects", "boq"]);
  const projects = await getProjects();
  return <ProjectsClient initialProjects={JSON.parse(JSON.stringify(projects))} />;
}
