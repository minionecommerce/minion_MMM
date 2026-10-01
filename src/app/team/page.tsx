import { getTeamData } from "@/services/team";
import { prisma } from "@/lib/db";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const data = await getTeamData();
  
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  const permissions = await prisma.permission.findMany({
    orderBy: [
      { module: "asc" },
      { action: "asc" }
    ]
  });

  return (
    <TeamClient
      initialEmployees={JSON.parse(JSON.stringify(data.employees))}
      departments={JSON.parse(JSON.stringify(data.departments))}
      projects={JSON.parse(JSON.stringify(data.projects))}
      roles={JSON.parse(JSON.stringify(roles))}
      allPermissions={JSON.parse(JSON.stringify(permissions))}
    />
  );
}

