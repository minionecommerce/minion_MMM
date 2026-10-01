"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDateStr = formData.get("dueDate") as string;
    const dueTimeStr = formData.get("dueTime") as string;
    const priority = formData.get("priority") as string;
    const projectId = formData.get("projectId") as string;

    // Default to the first employee
    const defaultAssignee = await prisma.employee.findFirst();
    if (!defaultAssignee) throw new Error("No employee found");

    let finalDueDate = null;
    if (dueDateStr) {
      finalDueDate = new Date(`${dueDateStr}T${dueTimeStr || '12:00'}:00Z`);
    }

    await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'Medium',
        status: 'Not Started',
        dueDate: finalDueDate,
        projectId: projectId || null,
        assigneeId: defaultAssignee.id,
      }
    });

    revalidatePath("/my-work");
    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function completeTask(taskId: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'Completed' }
    });
    
    // Log activity
    const task = await prisma.task.findUnique({ where: { id: taskId }});
    if (task?.assigneeId) {
      await prisma.activity.create({
        data: {
          employeeId: task.assigneeId,
          action: 'Completed Task',
          module: 'Tasks',
          recordId: taskId
        }
      });
    }

    revalidatePath("/my-work");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete task:", error);
    return { success: false, error: "Failed to complete task" };
  }
}

export async function createFollowUp(formData: FormData) {
  try {
    const customerName = formData.get("customerName") as string;
    const projectType = formData.get("projectType") as string;
    const followUpDateStr = formData.get("followUpDate") as string;
    const timeStr = formData.get("time") as string;
    const note = formData.get("note") as string;

    const defaultAssignee = await prisma.employee.findFirst();
    if (!defaultAssignee) throw new Error("No employee found");

    // Mock customer creation / finding
    let customer = await prisma.customer.findFirst({ where: { name: customerName }});
    if (!customer) {
      customer = await prisma.customer.create({ data: { name: customerName }});
    }

    let lead = await prisma.lead.findFirst({ where: { customerId: customer.id }});
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          propertyType: projectType || 'Residential',
          status: 'Follow-up'
        }
      });
    }

    let finalDate = new Date();
    if (followUpDateStr) {
      finalDate = new Date(`${followUpDateStr}T${timeStr || '12:00'}:00Z`);
    }

    await prisma.siteVisit.create({
      data: {
        leadId: lead.id,
        assignedTo: defaultAssignee.id,
        visitDate: finalDate,
        notes: note,
        status: 'Scheduled'
      }
    });

    revalidatePath("/my-work");
    return { success: true };
  } catch (error) {
    console.error("Failed to create follow-up:", error);
    return { success: false, error: "Failed to create follow-up" };
  }
}

export async function completeFollowUp(id: string) {
  try {
    const sv = await prisma.siteVisit.update({
      where: { id },
      data: { status: 'Completed' }
    });

    await prisma.activity.create({
      data: {
        employeeId: sv.assignedTo,
        action: 'Completed Follow-up',
        module: 'CRM',
        recordId: id
      }
    });

    revalidatePath("/my-work");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete follow-up:", error);
    return { success: false, error: "Failed to complete follow-up" };
  }
}
