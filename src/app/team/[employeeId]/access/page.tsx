import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EmployeeAccessClient from "./EmployeeAccessClient";

export default async function ManageAccessPage({ params }: { params: Promise<{ employeeId: string }> | { employeeId: string } }) {
  const resolvedParams = await params;
  const employeeId = resolvedParams.employeeId;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: { include: { role: true } },
      departmentRef: true,
      permissionOverrides: {
        include: { permission: true }
      },
      tempPermissions: {
        include: { permission: true }
      }
    }
  });

  if (!employee) return notFound();

  const allPermissions = await prisma.permission.findMany({
    orderBy: [
      { module: "asc" },
      { action: "asc" }
    ]
  });

  let rolePermissions: any[] = [];
  if (employee.user.roleId) {
    rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: employee.user.roleId },
      include: { permission: true }
    });
  }

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white p-6 selection:bg-yellow-400 selection:text-black">
      <div className="max-w-7xl mx-auto">
        <EmployeeAccessClient 
          employee={employee}
          allPermissions={allPermissions}
          rolePermissions={rolePermissions}
        />
      </div>
    </div>
  );
}
