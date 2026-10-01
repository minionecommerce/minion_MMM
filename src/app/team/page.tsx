import { requirePageAccess } from "@/lib/auth";
import { getTeamData } from "@/services/team";
import { prisma } from "@/lib/db";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requirePageAccess(["employees"]);
  const data = await getTeamData();
  const roles = await prisma.role.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  

  return (
    <TeamClient
      initialEmployees={JSON.parse(JSON.stringify(data.employees))}
      departments={JSON.parse(JSON.stringify(data.departments))}
      projects={JSON.parse(JSON.stringify(data.projects))}
      roles={roles}
    />
  );
}

