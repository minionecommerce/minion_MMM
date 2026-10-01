"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createEmployee(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const designation = formData.get("designation") as string;
    const departmentName = formData.get("department") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const managerId = formData.get("managerId") as string;
    const joiningDateStr = formData.get("joiningDate") as string;

    if (!name) {
      return { success: false, error: "Employee name is required." };
    }

    // Ensure User exists
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      const generatedEmail = email || `emp.${Date.now()}@minion.com`;
      user = await prisma.user.create({
        data: {
          name,
          email: generatedEmail,
        }
      });
    }

    // Ensure Department exists if passed
    let departmentRef = null;
    if (departmentName) {
      departmentRef = await prisma.department.findUnique({ where: { name: departmentName } });
      if (!departmentRef) {
        departmentRef = await prisma.department.create({
          data: { name: departmentName }
        });
      }
    }

    // Validate Manager
    let validManagerId = null;
    if (managerId) {
      const mgr = await prisma.employee.findUnique({ where: { id: managerId } });
      if (mgr) validManagerId = mgr.id;
    }

    // Create Employee
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        designation: designation || "Executive Staff",
        department: departmentName || null,
        departmentId: departmentRef?.id || null,
        contactNumber: contactNumber || null,
        managerId: validManagerId,
        joiningDate: joiningDateStr ? new Date(joiningDateStr) : new Date(),
      }
    });

    // Audit Log
    await prisma.activity.create({
      data: {
        employeeId: employee.id,
        action: `Created new employee profile: ${name} (${designation || "Staff"})`,
        module: "TEAM",
        recordId: employee.id,
      }
    }).catch(() => {});

    revalidatePath("/team");
    return { success: true, employeeId: employee.id };
  } catch (error: any) {
    console.error("Failed to create employee:", error);
    return { success: false, error: error.message || "Failed to create employee" };
  }
}

export async function createDepartment(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Department name is required." };

    let dept = await prisma.department.findUnique({ where: { name } });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name }
      });
    }

    revalidatePath("/team");
    return { success: true, department: dept };
  } catch (error: any) {
    console.error("Failed to create department:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  try {
    const designation = formData.get("designation") as string;
    const departmentName = formData.get("department") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const managerId = formData.get("managerId") as string;

    let departmentId = undefined;
    if (departmentName) {
      let dept = await prisma.department.findUnique({ where: { name: departmentName } });
      if (!dept) {
        dept = await prisma.department.create({ data: { name: departmentName } });
      }
      departmentId = dept.id;
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        designation: designation || undefined,
        department: departmentName || undefined,
        departmentId: departmentId,
        contactNumber: contactNumber || undefined,
        managerId: managerId || undefined,
      }
    });

    revalidatePath("/team");
    revalidatePath(`/team/${employeeId}`);
    return { success: true, employee };
  } catch (error: any) {
    console.error("Failed to update employee:", error);
    return { success: false, error: error.message };
  }
}

export async function assignTeamToProject(formData: FormData) {
  try {
    const projectId = formData.get("projectId") as string;
    const employeeId = formData.get("employeeId") as string;

    if (!projectId || !employeeId) {
      return { success: false, error: "Project and Employee selection are required." };
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return { success: false, error: "Target employee not found." };

    await prisma.project.update({
      where: { id: projectId },
      data: { managerId: employee.id }
    });

    await prisma.activity.create({
      data: {
        employeeId: employee.id,
        action: `Assigned as Lead Manager to project`,
        module: "TEAM",
        recordId: projectId,
      }
    }).catch(() => {});

    revalidatePath("/team");
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to assign team to project:", error);
    return { success: false, error: error.message };
  }
}

