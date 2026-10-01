import { getProjectById } from "@/services/projects";
import { notFound } from "next/navigation";
import ProjectDetailsClient from "./ProjectDetailsClient";
import { mockProjects } from "../data/mock";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  const resolvedParams = await params;
  const projectId = resolvedParams?.projectId;
  let dbProject: any = projectId ? await getProjectById(projectId) : null;

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


