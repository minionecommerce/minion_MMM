import { prisma } from "@/lib/db";
import RolesClient from "./RolesClient";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true, permissions: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return <RolesClient initialRoles={roles} />;
}
