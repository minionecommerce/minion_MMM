import { prisma } from "@/lib/db";

export async function getLandscapes() {
  try {
    const landscapes = await prisma.landscape.findMany({
      include: {
        customer: true,
        project: true,
        lead: true,
        manager: {
          include: {
            user: true
          }
        },
        plants: true,
        irrigationZones: true,
        maintenances: {
          include: {
            assignedTo: {
              include: { user: true }
            }
          },
          orderBy: { dueDate: 'asc' }
        },
        inspections: {
          include: {
            inspector: {
              include: { user: true }
            }
          },
          orderBy: { date: 'desc' }
        },
        issues: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { plants: true, irrigationZones: true, maintenances: true, inspections: true, issues: true, tasks: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return landscapes;
  } catch (error) {
    console.error("Failed to fetch landscapes:", error);
    return [];
  }
}

export async function getLandscapeById(id: string) {
  try {
    const landscape = await prisma.landscape.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        lead: true,
        manager: {
          include: {
            user: true
          }
        },
        plants: {
          orderBy: { createdAt: 'desc' }
        },
        irrigationZones: {
          orderBy: { createdAt: 'desc' }
        },
        maintenances: {
          include: {
            assignedTo: {
              include: { user: true }
            }
          },
          orderBy: { dueDate: 'asc' }
        },
        inspections: {
          include: {
            inspector: {
              include: { user: true }
            }
          },
          orderBy: { date: 'desc' }
        },
        issues: {
          include: {
            reportedBy: { include: { user: true } },
            assignedTo: { include: { user: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          include: {
            assignee: { include: { user: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return landscape;
  } catch (error) {
    console.error(`Failed to fetch landscape ${id}:`, error);
    return null;
  }
}

export async function getLandscapeMaintenances() {
  try {
    const maintenances = await prisma.landscapeMaintenance.findMany({
      include: {
        landscape: {
          include: { customer: true }
        },
        assignedTo: {
          include: { user: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    return maintenances;
  } catch (error) {
    console.error("Failed to fetch maintenance tasks:", error);
    return [];
  }
}

export async function getLandscapeIrrigationZones() {
  try {
    const zones = await prisma.irrigationZone.findMany({
      include: {
        landscape: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return zones;
  } catch (error) {
    console.error("Failed to fetch irrigation zones:", error);
    return [];
  }
}

export async function getLandscapePlants() {
  try {
    const plants = await prisma.plant.findMany({
      include: {
        landscape: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return plants;
  } catch (error) {
    console.error("Failed to fetch plants:", error);
    return [];
  }
}

export async function getLandscapeInspections() {
  try {
    const inspections = await prisma.landscapeInspection.findMany({
      include: {
        landscape: {
          include: { customer: true }
        },
        inspector: {
          include: { user: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return inspections;
  } catch (error) {
    console.error("Failed to fetch site inspections:", error);
    return [];
  }
}

export const getParksData = getLandscapes;

