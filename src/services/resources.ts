import { prisma } from "@/lib/db";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export async function getResourcesData() {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        owner: { include: { user: { select: SAFE_USER_SELECT } } },
        project: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return resources;
  } catch (error) {
    console.error("Failed to fetch resources data:", error);
    throw new Error("Failed to fetch resources data");
  }
}
