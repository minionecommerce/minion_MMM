import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import RoleDetailClient from "./RoleDetailClient";

export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> | { roleId: string } }) {
  const resolvedParams = await params;
  const roleId = resolvedParams.roleId;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      },
      users: {
        include: {
          employee: { include: { departmentRef: true } }
        }
      }
    }
  });

  if (!role) return notFound();

  const allPermissions = await prisma.permission.findMany({
    orderBy: [
      { module: "asc" },
      { action: "asc" }
    ]
  });

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white p-6 selection:bg-yellow-400 selection:text-black">
      <div className="max-w-7xl mx-auto">
        <RoleDetailClient role={role} allPermissions={allPermissions} />
      </div>
    </div>
  );
}
