import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requirePermission, getCurrentEmployee } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requirePermission("settings.manage");
    const adminEmp = await getCurrentEmployee();

    const body = await request.json();
    const { 
      employeeCode, 
      fullName, 
      email, 
      phone, 
      departmentId, 
      designation, 
      reportingManagerId, 
      joiningDate, 
      employmentType, 
      location, 
      status,
      loginEmail,
      password,
      roleId,
      overrides
    } = body;

    if (!fullName || !loginEmail || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: loginEmail,
          password: hashedPassword,
          roleId: roleId
        }
      });

      // 2. Create Employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          designation,
          departmentId: departmentId || undefined,
          contactNumber: phone,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          managerId: reportingManagerId || undefined
        }
      });

      // 3. Create EmployeePermissionOverrides
      if (overrides && overrides.length > 0) {
        for (const ov of overrides) {
          await tx.employeePermissionOverride.create({
            data: {
              employeeId: employee.id,
              permissionId: ov.permissionId,
              effect: ov.effect,
              scope: ov.scope || "ALL",
              createdById: adminEmp?.id
            }
          });
        }
      }

      // 4. Create Audit Log
      await tx.accessAuditLog.create({
        data: {
          employeeId: employee.id,
          changedById: adminEmp?.id,
          module: "TEAM",
          action: "EMPLOYEE_CREATED",
          reason: "Completed onboarding workflow"
        }
      });

      return employee;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
