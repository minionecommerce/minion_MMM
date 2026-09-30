"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAchievement(formData: FormData) {
  try {
    const employeeId = formData.get("employeeId") as string;
    const title = formData.get("title") as string;
    const pointsStr = formData.get("points") as string;
    const category = (formData.get("category") as string) || "General Achievement";
    const points = parseInt(pointsStr, 10) || 50;

    if (!title) {
      return { success: false, error: "Achievement title is required." };
    }

    // Resolve valid employee
    let validEmployeeId = employeeId;
    if (validEmployeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: validEmployeeId } });
      if (!emp) validEmployeeId = "";
    }
    if (!validEmployeeId) {
      const firstEmp = await prisma.employee.findFirst();
      if (!firstEmp) {
        return { success: false, error: "No employee found in database." };
      }
      validEmployeeId = firstEmp.id;
    }

    // Create Reward Record
    const reward = await prisma.reward.create({
      data: {
        employeeId: validEmployeeId,
        points,
        reason: `${category}: ${title}`,
        date: new Date(),
      }
    });

    // Create PointsLedger Transaction
    await prisma.pointsLedger.create({
      data: {
        employeeId: validEmployeeId,
        points,
        source: "Achievement Engine",
        category,
        referenceType: "Achievement",
        referenceId: reward.id,
        description: `Unlocked ${title} (+${points} pts)`,
      }
    });

    // Create Activity Record
    await prisma.activity.create({
      data: {
        employeeId: validEmployeeId,
        action: `Unlocked Achievement: ${title} (+${points} pts)`,
        module: "REWARDS",
        recordId: reward.id,
      }
    }).catch(() => {});

    revalidatePath("/rewards");
    revalidatePath("/my-work");
    return { success: true, rewardId: reward.id };
  } catch (error: any) {
    console.error("Failed to create achievement:", error);
    return { success: false, error: error.message || "Failed to create achievement" };
  }
}

export async function giveRecognition(formData: FormData) {
  try {
    const employeeId = formData.get("employeeId") as string;
    const message = formData.get("message") as string;
    const pointsStr = formData.get("points") as string;
    const points = parseInt(pointsStr, 10) || 25;

    if (!message) {
      return { success: false, error: "Recognition message is required." };
    }

    let targetEmp = null;
    if (employeeId) {
      targetEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
    }
    if (!targetEmp) {
      targetEmp = await prisma.employee.findFirst();
    }
    if (!targetEmp) {
      return { success: false, error: "No target employee found." };
    }

    // Points ledger entry
    await prisma.pointsLedger.create({
      data: {
        employeeId: targetEmp.id,
        points,
        source: "Peer Recognition",
        category: "Recognition",
        description: message,
      }
    });

    revalidatePath("/rewards");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to give recognition:", error);
    return { success: false, error: error.message };
  }
}

export async function claimReward(rewardTitle: string, pointsRequired: number) {
  try {
    const firstEmp = await prisma.employee.findFirst();
    if (!firstEmp) return { success: false, error: "No employee found to claim reward." };

    // Create negative points transaction to redeem reward
    await prisma.pointsLedger.create({
      data: {
        employeeId: firstEmp.id,
        points: -Math.abs(pointsRequired),
        source: "Reward Redemption",
        category: "Claim",
        description: `Claimed reward: ${rewardTitle}`,
      }
    });

    revalidatePath("/rewards");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to claim reward:", error);
    return { success: false, error: error.message };
  }
}

export async function submitWellnessClaim(formData: FormData) {
  try {
    const employeeId = formData.get("employeeId") as string;
    const activity = formData.get("activity") as string;
    const provider = formData.get("provider") as string;
    const amountStr = formData.get("amount") as string;
    const category = (formData.get("category") as string) || "Fitness & Sports";
    const points = parseInt(amountStr, 10) ? Math.min(100, Math.floor(parseInt(amountStr, 10) / 10)) : 50;

    if (!activity) {
      return { success: false, error: "Activity name is required." };
    }

    let targetEmpId = employeeId;
    if (targetEmpId) {
      const emp = await prisma.employee.findUnique({ where: { id: targetEmpId } });
      if (!emp) targetEmpId = "";
    }
    if (!targetEmpId) {
      const firstEmp = await prisma.employee.findFirst();
      if (!firstEmp) return { success: false, error: "No employee found." };
      targetEmpId = firstEmp.id;
    }

    await prisma.pointsLedger.create({
      data: {
        employeeId: targetEmpId,
        points,
        source: "Wellness Program",
        category: "Wellness",
        description: `Wellness Benefit Claim: ${activity} (${category}${provider ? ` via ${provider}` : ''})`,
      }
    });

    revalidatePath("/rewards");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit wellness claim:", error);
    return { success: false, error: error.message };
  }
}

export async function submitImpactActivity(formData: FormData) {
  try {
    const employeeId = formData.get("employeeId") as string;
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Community Service";
    const pointsStr = formData.get("points") as string;
    const points = parseInt(pointsStr, 10) || 50;

    if (!title) {
      return { success: false, error: "Impact activity title is required." };
    }

    let targetEmpId = employeeId;
    if (targetEmpId) {
      const emp = await prisma.employee.findUnique({ where: { id: targetEmpId } });
      if (!emp) targetEmpId = "";
    }
    if (!targetEmpId) {
      const firstEmp = await prisma.employee.findFirst();
      if (!firstEmp) return { success: false, error: "No employee found." };
      targetEmpId = firstEmp.id;
    }

    await prisma.pointsLedger.create({
      data: {
        employeeId: targetEmpId,
        points,
        source: "Community Impact",
        category: "Impact",
        description: `Social Impact Activity: ${title} (${category})`,
      }
    });

    revalidatePath("/rewards");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit impact activity:", error);
    return { success: false, error: error.message };
  }
}

