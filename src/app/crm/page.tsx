import { requirePageAccess } from "@/lib/auth";
import { CRM_MODULES } from "@/lib/rbac/catalog";
import { getLeads, getCRMDashboardData, getCRMAnalyticsData } from "@/services/crm";
import { prisma } from "@/lib/db";
import CRMClient from "./CRMClient";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  await requirePageAccess(CRM_MODULES);
  const [leads, dashboardData, analytics, employees, followUps, siteVisits, deals, quotes] = await Promise.all([
    getLeads(),
    getCRMDashboardData(),
    getCRMAnalyticsData(),
    prisma.employee.findMany({
      include: { user: { select: SAFE_USER_SELECT } },
      orderBy: { user: { name: 'asc' } }
    }),
    prisma.followUp.findMany({
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true, status: true } },
        deal: { select: { id: true, dealNumber: true } },
        assignedTo: { include: { user: { select: SAFE_USER_SELECT } } },
      },
      orderBy: { scheduledDate: 'asc' }
    }),
    prisma.siteVisit.findMany({
      include: {
        lead: { include: { customer: true } },
        employee: { include: { user: { select: SAFE_USER_SELECT } } },
      },
      orderBy: { visitDate: 'asc' }
    }),
    prisma.deal.findMany({
      where: { deletedAt: null },
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true } },
        salesExecutive: { include: { user: { select: SAFE_USER_SELECT } } },
        quotes: { where: { deletedAt: null }, select: { id: true, quoteNumber: true, amount: true, status: true, type: true } },
        projects: { select: { id: true, name: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.quote.findMany({
      where: { deletedAt: null },
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true } },
        deal: { select: { id: true, dealNumber: true } },
        createdBy: { include: { user: { select: SAFE_USER_SELECT } } },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
  ]);

  return (
    <CRMClient
      initialLeads={JSON.parse(JSON.stringify(leads))}
      dashboardData={JSON.parse(JSON.stringify(dashboardData))}
      analytics={JSON.parse(JSON.stringify(analytics))}
      employees={JSON.parse(JSON.stringify(employees))}
      followUps={JSON.parse(JSON.stringify(followUps))}
      siteVisits={JSON.parse(JSON.stringify(siteVisits))}
      deals={JSON.parse(JSON.stringify(deals))}
      quotes={JSON.parse(JSON.stringify(quotes))}
    />
  );
}
