import { prisma } from "@/lib/db";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export async function getTeam() {
  try {
    const team = await prisma.employee.findMany({
      include: {
        user: { select: SAFE_USER_SELECT },
        departmentRef: true,
        manager: {
          include: { user: { select: SAFE_USER_SELECT } }
        },
        tasksAssigned: {
          include: { project: true }
        },
        projectsManaged: {
          include: { customer: true }
        },
        landscapesManaged: true,
        _count: {
          select: { tasksAssigned: true, projectsManaged: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return team;
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return [];
  }
}

export async function getTeamData() {
  try {
    const [employees, departments, projects] = await Promise.all([
      getTeam(),
      prisma.department.findMany({
        include: {
          employees: {
            include: { user: { select: SAFE_USER_SELECT } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.project.findMany({
        select: { id: true, name: true, customer: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    return { employees, departments, projects };
  } catch (error) {
    console.error("Failed to fetch team data:", error);
    return { employees: [], departments: [], projects: [] };
  }
}

export async function getEmployeeById(id: string) {
  if (!id || typeof id !== 'string') return null;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { ...SAFE_USER_SELECT, role: true } },
        departmentRef: true,
        manager: {
          include: { user: { select: SAFE_USER_SELECT } }
        },
        subordinates: {
          include: { user: { select: SAFE_USER_SELECT } }
        },
        tasksAssigned: {
          include: {
            project: { include: { customer: true } }
          },
          orderBy: { updatedAt: 'desc' }
        },
        projectsManaged: {
          include: { customer: true },
          orderBy: { updatedAt: 'desc' }
        },
        landscapesManaged: true,
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        rewards: true,
        enrollments: {
          include: { course: true }
        }
      }
    });
    return employee;
  } catch (error) {
    console.error(`Failed to fetch employee ${id}:`, error);
    return null;
  }
}

