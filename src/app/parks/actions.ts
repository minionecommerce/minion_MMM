"use server";
import { authorizeAction } from "@/lib/auth";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createLandscape(formData: FormData) {
  const auth = await authorizeAction("parks", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const name = formData.get("name") as string;
    const customerName = formData.get("customerName") as string;
    const type = (formData.get("type") as string) || "Residential Garden";
    const location = formData.get("location") as string;
    const value = parseFloat((formData.get("value") as string) || "0");
    const startDateStr = formData.get("startDate") as string;
    const expectedCompletionStr = formData.get("expectedCompletion") as string;
    const description = formData.get("description") as string;
    const priority = (formData.get("priority") as string) || "Medium";
    const managerIdInput = formData.get("managerId") as string;
    const leadId = formData.get("leadId") as string;
    const projectId = formData.get("projectId") as string;

    if (!name || !customerName) {
      return { success: false, error: "Landscape Name and Customer Name are required." };
    }

    // Customer resolution
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

    // Manager resolution
    let validManager = null;
    if (managerIdInput) {
      validManager = await prisma.employee.findUnique({ where: { id: managerIdInput } });
    }
    if (!validManager) {
      validManager = (auth.ctx.employeeId ? await prisma.employee.findUnique({ where: { id: auth.ctx.employeeId } }) : null);
    }
    const managerId = validManager?.id || null;

    // ID generation: LAND-2026-0001
    const landCount = await prisma.landscape.count();
    const landscapeNumber = `LAND-2026-${String(landCount + 1).padStart(4, "0")}`;

    const landscape = await prisma.landscape.create({
      data: {
        landscapeNumber,
        name,
        type,
        location: location || null,
        value: value,
        startDate: startDateStr ? new Date(startDateStr) : new Date(),
        expectedCompletion: expectedCompletionStr ? new Date(expectedCompletionStr) : null,
        description: description || null,
        priority,
        stage: "Enquiry",
        status: "Active",
        progress: 10,
        health: 90,
        healthStatus: "Healthy",
        customerId: customer.id,
        managerId: managerId || null,
        leadId: leadId || null,
        projectId: projectId || null,
      }
    });

    // Create Activity Log
    if (managerId) {
      await prisma.activity.create({
        data: {
          employeeId: managerId,
          action: `Created new landscape ${landscapeNumber}: ${name}`,
          module: "PARKS",
          recordId: landscape.id,
        }
      }).catch(() => {});
    }

    revalidatePath("/parks");
    return { success: true, landscapeId: landscape.id, landscapeNumber };
  } catch (error: any) {
    console.error("Failed to create landscape:", error);
    return { success: false, error: error.message || "Failed to create landscape" };
  }
}

export async function updateLandscapeStage(landscapeId: string, stage: string) {
  const auth = await authorizeAction("parks", "edit");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const validStages = [
      "Enquiry", "Design", "Site Preparation", "Plantation",
      "Irrigation", "Landscaping", "Lighting", "Maintenance", "Completed"
    ];

    if (!validStages.includes(stage)) {
      return { success: false, error: `Invalid stage: ${stage}` };
    }

    const landscape = await prisma.landscape.update({
      where: { id: landscapeId },
      data: {
        stage,
        progress: stage === "Completed" ? 100 : stage === "Maintenance" ? 90 : stage === "Lighting" ? 80 : 50,
        status: stage === "Completed" ? "Completed" : "Active",
      }
    });

    revalidatePath("/parks");
    revalidatePath(`/parks/${landscapeId}`);
    return { success: true, landscape };
  } catch (error: any) {
    console.error("Failed to update stage:", error);
    return { success: false, error: error.message };
  }
}

export async function scheduleMaintenance(formData: FormData) {
  const auth = await authorizeAction("parks", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const landscapeId = formData.get("landscapeId") as string;
    const type = formData.get("type") as string;
    const dueDateStr = formData.get("dueDate") as string;
    const frequency = (formData.get("frequency") as string) || "Weekly";
    const priority = (formData.get("priority") as string) || "Medium";
    const assignedToId = formData.get("assignedToId") as string;
    const notes = formData.get("notes") as string;

    if (!landscapeId || !type || !dueDateStr) {
      return { success: false, error: "Landscape, Maintenance Type, and Due Date are required." };
    }

    const maintCount = await prisma.landscapeMaintenance.count();
    const maintenanceNumber = `MAINT-2026-${String(maintCount + 1).padStart(4, "0")}`;

    const maintenance = await prisma.landscapeMaintenance.create({
      data: {
        maintenanceNumber,
        landscapeId,
        type,
        dueDate: new Date(dueDateStr),
        frequency,
        priority,
        status: "Scheduled",
        assignedToId: assignedToId || null,
        notes: notes || null,
      }
    });

    // Update landscape nextMaintenanceDate
    await prisma.landscape.update({
      where: { id: landscapeId },
      data: { nextMaintenanceDate: new Date(dueDateStr) }
    }).catch(() => {});

    revalidatePath("/parks");
    revalidatePath(`/parks/${landscapeId}`);
    return { success: true, maintenance };
  } catch (error: any) {
    console.error("Failed to schedule maintenance:", error);
    return { success: false, error: error.message };
  }
}

export async function createSiteInspection(formData: FormData) {
  const auth = await authorizeAction("parks", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const landscapeId = formData.get("landscapeId") as string;
    const inspectorId = formData.get("inspectorId") as string;
    const dateStr = formData.get("date") as string;
    const weather = formData.get("weather") as string;
    const plantHealthScore = parseInt((formData.get("plantHealthScore") as string) || "90", 10);
    const irrigationScore = parseInt((formData.get("irrigationScore") as string) || "90", 10);
    const soilScore = parseInt((formData.get("soilScore") as string) || "90", 10);
    const cleanlinessScore = parseInt((formData.get("cleanlinessScore") as string) || "90", 10);
    const safetyScore = parseInt((formData.get("safetyScore") as string) || "90", 10);
    const remarks = formData.get("remarks") as string;

    if (!landscapeId) {
      return { success: false, error: "Landscape selection is required." };
    }

    const overallScore = Math.round((plantHealthScore + irrigationScore + soilScore + cleanlinessScore + safetyScore) / 5);
    const inspCount = await prisma.landscapeInspection.count();
    const inspectionNumber = `INSP-2026-${String(inspCount + 1).padStart(4, "0")}`;

    const inspection = await prisma.landscapeInspection.create({
      data: {
        inspectionNumber,
        landscapeId,
        inspectorId: inspectorId || null,
        date: dateStr ? new Date(dateStr) : new Date(),
        weather: weather || "Sunny",
        plantHealthScore,
        irrigationScore,
        soilScore,
        cleanlinessScore,
        safetyScore,
        overallScore,
        remarks: remarks || null,
      }
    });

    // Update overall site health score on landscape
    const healthStatus = overallScore >= 80 ? "Healthy" : overallScore >= 60 ? "Attention" : "Critical";
    await prisma.landscape.update({
      where: { id: landscapeId },
      data: {
        health: overallScore,
        healthStatus,
      }
    }).catch(() => {});

    revalidatePath("/parks");
    revalidatePath(`/parks/${landscapeId}`);
    return { success: true, inspection, overallScore };
  } catch (error: any) {
    console.error("Failed to create site inspection:", error);
    return { success: false, error: error.message };
  }
}

export async function createIrrigationZone(formData: FormData) {
  const auth = await authorizeAction("parks", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const landscapeId = formData.get("landscapeId") as string;
    const zoneName = formData.get("zoneName") as string;
    const controller = formData.get("controller") as string;
    const valve = formData.get("valve") as string;
    const schedule = (formData.get("schedule") as string) || "Daily";
    const durationMinutes = parseInt((formData.get("durationMinutes") as string) || "15", 10);
    const frequency = formData.get("frequency") as string;

    if (!landscapeId || !zoneName) {
      return { success: false, error: "Landscape ID and Zone Name are required." };
    }

    const zone = await prisma.irrigationZone.create({
      data: {
        landscapeId,
        zoneName,
        controller: controller || null,
        valve: valve || null,
        schedule,
        frequency: frequency || "Daily at 06:00 AM",
        durationMinutes,
        status: "Active",
      }
    });

    revalidatePath("/parks");
    revalidatePath(`/parks/${landscapeId}`);
    return { success: true, zone };
  } catch (error: any) {
    console.error("Failed to create irrigation zone:", error);
    return { success: false, error: error.message };
  }
}

export async function createPlantAllocation(formData: FormData) {
  const auth = await authorizeAction("parks", "create");
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const landscapeId = formData.get("landscapeId") as string;
    const species = formData.get("species") as string;
    const commonName = formData.get("commonName") as string;
    const category = (formData.get("category") as string) || "Shrub";
    const quantity = parseInt((formData.get("quantity") as string) || "1", 10);
    const locationZone = formData.get("locationZone") as string;

    if (!landscapeId || !species) {
      return { success: false, error: "Landscape ID and Plant Species are required." };
    }

    const plant = await prisma.plant.create({
      data: {
        landscapeId,
        species,
        commonName: commonName || species,
        category,
        quantity,
        locationZone: locationZone || null,
        plantingDate: new Date(),
        health: "Healthy",
        status: "Planted",
      }
    });

    revalidatePath("/parks");
    revalidatePath(`/parks/${landscapeId}`);
    return { success: true, plant };
  } catch (error: any) {
    console.error("Failed to add plant allocation:", error);
    return { success: false, error: error.message };
  }
}
