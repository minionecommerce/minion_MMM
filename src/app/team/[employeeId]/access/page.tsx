import { notFound, redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Employee access moved to User Management → Permissions
export default async function ManageAccessRedirect({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePageAccess(["users"]);
  const { employeeId } = await params;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { userId: true } });
  if (!employee) notFound();
  redirect(`/users/${employee.userId}/permissions`);
}
