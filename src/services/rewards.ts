import { prisma } from "@/lib/db";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export async function getRewardsData() {
  try {
    const [rewards, ledgers, employees, wonDeals] = await Promise.all([
      prisma.reward.findMany({
        include: { employee: { include: { user: { select: SAFE_USER_SELECT } } } },
        orderBy: { date: 'desc' }
      }),
      prisma.pointsLedger.findMany({
        include: { employee: { include: { user: { select: SAFE_USER_SELECT } } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.findMany({
        include: { user: { select: SAFE_USER_SELECT }, departmentRef: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.deal.findMany({
        where: { stage: 'Won' },
        select: { value: true }
      })
    ]);

    // Calculate total realized revenue from Won deals
    const totalRevenueValue = wonDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);

    // Calculate total points earned across ledgers
    const totalPointsEarned = ledgers.reduce((acc, l) => acc + (l.points > 0 ? l.points : 0), 0);

    return {
      rewards,
      ledgers,
      employees,
      totalRevenueValue,
      totalPointsEarned
    };
  } catch (error) {
    console.error("Failed to fetch rewards data:", error);
    return {
      rewards: [],
      ledgers: [],
      employees: [],
      totalRevenueValue: 0,
      totalPointsEarned: 0
    };
  }
}

