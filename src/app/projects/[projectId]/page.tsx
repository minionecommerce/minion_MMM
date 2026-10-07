import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { can, requirePageAccess } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { getLayout } from "@/lib/records/layout";
import { activeUsers } from "@/lib/records/lookups";
import { getTaskOptions } from "@/lib/tasks/service";
import { getProjectDetail } from "@/lib/projects/detail";
import { getProjectById } from "@/services/projects";
import ProjectDetailsClient from "./ProjectDetailsClient";
import ProjectView from "../view/ProjectView";
import { mockProjects } from "../data/mock";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({ params, searchParams }: {
  params: Promise<{ projectId: string }> | { projectId: string };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const projectId = resolvedParams?.projectId;
  const query = await searchParams;
  const tab = Array.isArray(query?.tab) ? query.tab[0] : query?.tab; // the tab to open first (?tab=vendors)
  const found = projectId ? await prisma.project.findUnique({ where: { id: projectId }, select: { projectCode: true } }) : null;

  // A project made by Convert to Project (it has a code, MP1, MP2 ...): the project page with its templates
  if (found?.projectCode) {
    const ctx = await requirePageAccess(["projects"]);
    let detail;
    try {
      detail = await getProjectDetail(ctx, projectId);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 404) notFound();
      throw err;
    }
    const [layout, users, taskOptions] = await Promise.all([
      getLayout("project"),
      activeUsers(),
      can(ctx, "tasks", "view") ? getTaskOptions(ctx) : Promise.resolve(null),
    ]);
    return <ProjectView initial={JSON.parse(JSON.stringify(detail))} layout={layout} users={users} taskOptions={taskOptions} userName={ctx.name ?? ""} initialTab={tab} />;
  }

  // A project of the older CRM (no project code): its older page, as it was
  await requirePageAccess(["projects", "boq"]);
  let dbProject: any = projectId ? await getProjectById(projectId) : null; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fallback to mock project if matching ID in mock data
  if (!dbProject) {
    const mockMatch = mockProjects.find(p => p.id === projectId);
    if (mockMatch) {
      dbProject = {
        id: mockMatch.id,
        name: mockMatch.name,
        type: mockMatch.type,
        value: mockMatch.financials.contractValue,
        status: mockMatch.status,
        startDate: mockMatch.startDate,
        expectedEndDate: mockMatch.expectedCompletion,
        customer: { name: mockMatch.customerName, customerCode: mockMatch.customerCode, address: mockMatch.location },
        lead: { siteLocation: mockMatch.location, propertyType: mockMatch.propertyType },
        manager: { user: { name: mockMatch.projectManager } },
        tasks: [],
        boqItems: [],
        expenses: [],
        payments: [],
      };
    }
  }

  if (!dbProject) {
    notFound();
  }

  return <ProjectDetailsClient dbProject={JSON.parse(JSON.stringify(dbProject))} />;
}
