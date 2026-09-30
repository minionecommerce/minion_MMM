import { getLeads, getCRMDashboardData, getCRMAnalyticsData } from "@/services/crm";
import { prisma } from "@/lib/db";
import CRMClient from "./CRMClient";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const [leads, dashboardData, analytics, employees, followUps, siteVisits, deals, quotes] = await Promise.all([
    getLeads(),
    getCRMDashboardData(),
    getCRMAnalyticsData(),
    prisma.employee.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } }
    }),
    prisma.followUp.findMany({
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true, status: true } },
        deal: { select: { id: true, dealNumber: true } },
        assignedTo: { include: { user: true } },
      },
      orderBy: { scheduledDate: 'asc' }
    }),
    prisma.siteVisit.findMany({
      include: {
        lead: { include: { customer: true } },
        employee: { include: { user: true } },
      },
      orderBy: { visitDate: 'asc' }
    }),
    prisma.deal.findMany({
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true } },
        salesExecutive: { include: { user: true } },
        quotes: { select: { id: true, quoteNumber: true, amount: true, status: true, type: true } },
        projects: { select: { id: true, name: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.quote.findMany({
      include: {
        customer: true,
        lead: { select: { id: true, leadNumber: true } },
        deal: { select: { id: true, dealNumber: true } },
        createdBy: { include: { user: true } },
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
