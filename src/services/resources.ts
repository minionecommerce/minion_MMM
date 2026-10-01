import { prisma } from "@/lib/db";

export async function getResourcesData() {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        owner: { include: { user: true } },
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
