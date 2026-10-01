import { prisma } from "@/lib/db";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: {
          include: {
            customer: true
          }
        },
        assignee: {
          include: {
            user: { select: SAFE_USER_SELECT }
          }
        },
        secondaryAssignee: {
          include: { user: { select: SAFE_USER_SELECT } }
        },
        assignedBy: {
          include: { user: { select: SAFE_USER_SELECT } }
        },
        landscape: true,
        checklists: true,
        comments: {
          include: { author: { include: { user: { select: SAFE_USER_SELECT } } } },
          orderBy: { createdAt: 'desc' }
        },
        recurringSeries: true,
        auditLogs: {
          include: { employee: { include: { user: { select: SAFE_USER_SELECT } } } },
          orderBy: { createdAt: 'desc' }
        },
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return tasks;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}

export async function getTasksData() {
  try {
    const [tasks, employees, projects, landscapes] = await Promise.all([
      getTasks(),
      prisma.employee.findMany({
        include: { user: { select: SAFE_USER_SELECT }, departmentRef: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.findMany({
        select: { id: true, name: true, customer: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.landscape.findMany({
        select: { id: true, name: true, location: true },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    return { tasks, employees, projects, landscapes };
  } catch (error) {
    console.error("Failed to fetch tasks page data:", error);
    return { tasks: [], employees: [], projects: [], landscapes: [] };
  }
}

