import { prisma } from "@/lib/db";

export async function getLearningData() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: { employee: { include: { user: true } } }
        },
        sessions: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return courses;
  } catch (error) {
    console.error("Failed to fetch learning data:", error);
    throw new Error("Failed to fetch learning data");
  }
}
