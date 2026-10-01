import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission, getCurrentEmployee } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("settings.manage");
    const adminEmp = await getCurrentEmployee();

    const { overrides } = await request.json(); // Array of EmployeeOverride

    const { id: employeeId } = await params;

    // We do a transaction to wipe old overrides and set new ones
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing overrides for this employee
      await tx.employeePermissionOverride.deleteMany({
        where: { employeeId }
      });

      // 2. Insert new overrides
      for (const override of overrides) {
        await tx.employeePermissionOverride.create({
          data: {
            employeeId,
            permissionId: override.permissionId,
            effect: override.effect,
            scope: override.scope || "ALL",
            createdById: adminEmp?.id
          }
        });
      }
      
      // We could also write to AccessAuditLog here
      await tx.accessAuditLog.create({
        data: {
          employeeId,
          changedById: adminEmp?.id,
          module: "MULTIPLE",
          action: "OVERRIDE_UPDATE",
          reason: "Manual admin override update"
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
