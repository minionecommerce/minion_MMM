"use server";
import { authorizeAction } from "@/lib/auth";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const auth = await authorizeAction("projects", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const name = formData.get("name") as string;
    const customerName = formData.get("customerName") as string;
    const type = formData.get("type") as string;
    const contractValue = parseFloat((formData.get("contractValue") as string) || "0");
    const startDateStr = formData.get("startDate") as string;
    const expectedEndDateStr = formData.get("expectedEndDate") as string;
    const location = formData.get("location") as string;
    const managerIdInput = formData.get("managerId") as string;

    if (!name || !customerName) {
      return { success: false, error: "Project name and Customer name are required." };
    }

    // Find existing customer or create a new customer record
    let customer = await prisma.customer.findFirst({
      where: { name: { equals: customerName, mode: "insensitive" } }
    });

    if (!customer) {
      const custCount = await prisma.customer.count();
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          customerCode: `MIN-CUST-2026-${String(custCount + 1).padStart(4, "0")}`,
          address: location || undefined,
        }
      });
    }

    // Assign manager with valid foreign key verification
    let validManager = null;
    if (managerIdInput) {
      validManager = await prisma.employee.findUnique({ where: { id: managerIdInput } });
    }
    // Default to the signed-in employee; never invent an account
    if (!validManager && auth.ctx.employeeId) {
      validManager = await prisma.employee.findUnique({ where: { id: auth.ctx.employeeId } });
    }
    if (!validManager) {
      return { success: false, error: "Please select a project manager." };
    }
    const managerId = validManager.id;

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        type: type || "Other",
        value: contractValue,
        status: "Active",
        startDate: startDateStr ? new Date(startDateStr) : new Date(),
        expectedEndDate: expectedEndDateStr ? new Date(expectedEndDateStr) : null,
        customerId: customer.id,
        managerId: managerId,
      }
    });

    revalidatePath("/projects");
    return { success: true, projectId: project.id };
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return { success: false, error: error.message || "Failed to create project" };
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  const auth = await authorizeAction("projects", "edit");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status }
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to update project status:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const auth = await authorizeAction("projects", "edit");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { progress }
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to update project progress:", error);
    return { success: false, error: error.message };
  }
}

export async function createProjectTask(formData: FormData) {
  const auth = await authorizeAction("projects", "edit");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = (formData.get("priority") as string) || "Medium";
    const dueDateStr = formData.get("dueDate") as string;

    if (!projectId || !title) {
      return { success: false, error: "Task title and Project ID are required." };
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        priority,
        status: "Not Started",
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
      }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, task };
  } catch (error: any) {
    console.error("Failed to create project task:", error);
    return { success: false, error: error.message };
  }
}

export async function createProjectBOQItem(formData: FormData) {
  const auth = await authorizeAction("boq", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const projectId = formData.get("projectId") as string;
    const category = formData.get("category") as string;
    const item = formData.get("item") as string;
    const quantity = parseFloat((formData.get("quantity") as string) || "1");
    const unit = (formData.get("unit") as string) || "nos";
    const rate = parseFloat((formData.get("rate") as string) || "0");
    const amount = quantity * rate;

    if (!projectId || !item || !category) {
      return { success: false, error: "Category, item, and project ID are required." };
    }

    const boq = await prisma.boqItem.create({
      data: {
        projectId,
        category,
        item,
        quantity,
        unit,
        rate,
        amount,
        status: "Pending",
      }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, boq };
  } catch (error: any) {
    console.error("Failed to create BOQ item:", error);
    return { success: false, error: error.message };
  }
}

export async function createProjectPayment(formData: FormData) {
  const auth = await authorizeAction("payments", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const projectId = formData.get("projectId") as string;
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const paymentType = (formData.get("paymentType") as string) || "Inbound";
    const status = (formData.get("status") as string) || "Paid";

    if (!projectId || amount <= 0) {
      return { success: false, error: "Valid amount and project ID are required." };
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: "Project not found." };

    const payment = await prisma.payment.create({
      data: {
        projectId,
        customerId: project.customerId,
        amount,
        paymentType,
        status,
        date: new Date(),
      }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, payment };
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    return { success: false, error: error.message };
  }
}

export async function createProjectExpense(formData: FormData) {
  const auth = await authorizeAction("projects", "edit");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const projectId = formData.get("projectId") as string;
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const category = (formData.get("category") as string) || "Material";
    const description = formData.get("description") as string;

    if (!projectId || amount <= 0) {
      return { success: false, error: "Valid amount and project ID are required." };
    }

    const expense = await prisma.expense.create({
      data: {
        projectId,
        amount,
        category,
        description: description || null,
        date: new Date(),
      }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, expense };
  } catch (error: any) {
    console.error("Failed to record expense:", error);
    return { success: false, error: error.message };
  }
}

