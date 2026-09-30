import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getLeads() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    let salesExecutiveId: string | undefined;
    if (userId) {
      const employee = await prisma.employee.findUnique({
        where: { userId },
        include: { user: { include: { role: true } } }
      });
      const roleName = (employee?.user?.role?.name || '').toLowerCase();
      if (roleName === 'sales' && employee) {
        salesExecutiveId = employee.id;
      }
    }

    const where = salesExecutiveId ? { salesExecutiveId } : {};

    const leads = await prisma.lead.findMany({
      where,
      include: {
        customer: true,
        salesExecutive: { include: { user: true } },
        deals: { select: { id: true, status: true, value: true } },
        siteVisits: { select: { id: true, status: true, visitDate: true } },
        followUps: { select: { id: true, status: true, scheduledDate: true } },
        quotes: { select: { id: true, status: true, amount: true, type: true } },
      },
      orderBy: { updatedAt: 'desc' }
    });
    return leads;
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function getCRMDashboardData() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      totalLeads,
      newLeads,
      followUpsTotal,
      followUpsToday,
      siteVisitsUpcoming,
      activeDealsCount,
      wonDealsThisMonth,
      pipelineAgg,
      statusGroups,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'New' } }),
      prisma.followUp.count({ where: { status: 'Pending' } }),
      prisma.followUp.count({
        where: {
          status: 'Pending',
          scheduledDate: { gte: startOfDay, lte: endOfDay }
        }
      }),
      prisma.siteVisit.count({ where: { status: { in: ['Scheduled', 'Confirmed'] } } }),
      prisma.deal.count({ where: { status: { notIn: ['Won', 'Lost', 'Cancelled'] } } }),
      prisma.deal.findMany({
        where: { status: 'Won', wonAt: { gte: startOfMonth, lte: endOfMonth } },
        select: { value: true }
      }),
      prisma.deal.aggregate({
        where: { status: { notIn: ['Won', 'Lost', 'Cancelled'] } },
        _sum: { value: true }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { expectedValue: true },
      }),
    ]);

    const wonValue = wonDealsThisMonth.reduce((sum, d) => sum + Number(d.value), 0);
    const pipelineValue = Number(pipelineAgg._sum.value || 0);

    return {
      stats: {
        totalLeads,
        newLeads,
        followUps: { total: followUpsTotal, dueToday: followUpsToday },
        siteVisits: { upcoming: siteVisitsUpcoming },
        activeDeals: { count: activeDealsCount, pipeline: pipelineValue },
        wonThisMonth: { count: wonDealsThisMonth.length, value: wonValue },
      },
      statusGroups,
    };
  } catch (error) {
    console.error("Failed to fetch CRM dashboard data:", error);
    return {
      stats: {
        totalLeads: 0,
        newLeads: 0,
        followUps: { total: 0, dueToday: 0 },
        siteVisits: { upcoming: 0 },
        activeDeals: { count: 0, pipeline: 0 },
        wonThisMonth: { count: 0, value: 0 },
      },
      statusGroups: [],
    };
  }
}

export async function getCRMAnalyticsData() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalLeads, wonLeads,
      totalFollowUps, completedFollowUps,
      totalSiteVisits, completedSiteVisits,
      totalQuotes, acceptedQuotes,
      totalDeals, wonDeals,
      pipelineAgg,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.lead.count({ where: { status: 'Won', updatedAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.followUp.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.followUp.count({ where: { status: 'Completed', updatedAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.siteVisit.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.siteVisit.count({ where: { status: 'Completed', updatedAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.quote.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.quote.count({ where: { status: 'Accepted', updatedAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.deal.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.deal.count({ where: { status: 'Won', wonAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.deal.aggregate({
        where: { status: { notIn: ['Won', 'Lost', 'Cancelled'] } },
        _sum: { value: true }
      }),
    ]);

    const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
    const pipelineValue = Number(pipelineAgg._sum.value || 0);

    return {
      leadConversion: { value: pct(wonLeads, totalLeads), desc: `${wonLeads}/${totalLeads} won` },
      followUpRate: { value: pct(completedFollowUps, totalFollowUps), desc: `${completedFollowUps}/${totalFollowUps} done` },
      siteVisitConversion: { value: pct(completedSiteVisits, totalSiteVisits), desc: `${completedSiteVisits}/${totalSiteVisits} completed` },
      quoteAcceptance: { value: pct(acceptedQuotes, totalQuotes), desc: `${acceptedQuotes}/${totalQuotes} accepted` },
      dealConversion: { value: pct(wonDeals, totalDeals), desc: `${wonDeals}/${totalDeals} won` },
      pipelineValue: { value: pipelineValue, desc: `Active pipeline` },
    };
  } catch (err) {
    console.error("Failed to fetch CRM analytics:", err);
    return null;
  }
}
