'use client';

import { useState, useMemo } from 'react';
import ProjectDetailsHeader from './components/ProjectDetailsHeader';
import ProjectOverview from './components/ProjectOverview';
import ProjectTasks from './components/ProjectTasks';
import ProjectBOQ from './components/ProjectBOQ';
import ProjectProcurement from './components/ProjectProcurement';
import ProjectSiteVisits from './components/ProjectSiteVisits';
import ProjectTeam from './components/ProjectTeam';
import ProjectDocuments from './components/ProjectDocuments';
import ProjectPayments from './components/ProjectPayments';
import ProjectExpenses from './components/ProjectExpenses';
import ProjectIssues from './components/ProjectIssues';
import ProjectTimeline from './components/ProjectTimeline';
import { mockProjects, mockTasks, mockBOQ, mockProcurement, mockSiteVisits, mockTeam, mockDocuments, mockPayments, mockExpenses, mockIssues, mockTimeline } from '../data/mock';

type Tab = 'Overview' | 'Tasks' | 'BOQ' | 'Procurement' | 'Site Visits' | 'Team' | 'Documents' | 'Payments' | 'Expenses' | 'Issues' | 'Timeline' | 'Reports';

const tabs: Tab[] = ['Overview', 'Tasks', 'BOQ', 'Procurement', 'Site Visits', 'Team', 'Documents', 'Payments', 'Expenses', 'Issues', 'Timeline', 'Reports'];

interface ProjectDetailsClientProps {
  dbProject: any;
}

export default function ProjectDetailsClient({ dbProject }: ProjectDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  // Map database project to UI project object format
  const project = useMemo(() => {
    if (!dbProject) return mockProjects[0];

    const contractVal = Number(dbProject.value || 0);
    const gst = contractVal * 0.18;
    const totalContractVal = contractVal + gst;

    const actualCost = (dbProject.expenses || []).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
    const receivedAmount = (dbProject.payments || [])
      .filter((p: any) => p.paymentType === 'Inbound' || p.status === 'Completed' || p.status === 'Paid')
      .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

    const pendingAmount = Math.max(0, totalContractVal - receivedAmount);
    const expectedProfit = Math.round(contractVal * 0.25);
    const currentProfit = receivedAmount - actualCost;

    return {
      id: dbProject.id,
      name: dbProject.name,
      customerName: dbProject.customer?.name || 'Unknown',
      customerCode: dbProject.customer?.customerCode || `CUST-${dbProject.customerId?.substring(0,4)}`,
      type: dbProject.type || 'Smart Home Automation',
      location: dbProject.lead?.siteLocation || dbProject.customer?.address || 'Chennai, TN',
      propertyType: dbProject.lead?.propertyType || 'Villa',
      projectManager: dbProject.manager?.user?.name || dbProject.manager?.designation || 'Dinesh Subramanian',
      projectCoordinator: 'Rahul S A',
      salesExecutive: dbProject.lead?.salesExecutive?.user?.name || 'Mukesh V',
      progress: dbProject.progress || 0,
      stage: (dbProject.status === 'Completed' ? 'Completed' : dbProject.status === 'Planning' ? 'Planning' : 'Execution') as any,
      status: dbProject.status || 'Active',
      startDate: dbProject.startDate ? new Date(dbProject.startDate).toISOString().split('T')[0] : '2026-01-10',
      expectedCompletion: dbProject.expectedEndDate ? new Date(dbProject.expectedEndDate).toISOString().split('T')[0] : '2026-06-30',
      priority: (dbProject.lead?.priority || 'Medium') as any,
      crmRefs: {
        leadId: dbProject.lead?.leadNumber || dbProject.leadId || 'MIN-LEAD-2026-0001',
        dealId: dbProject.deal?.dealNumber || dbProject.dealId || 'DEAL-2026-0001',
        quoteId: 'QT-2026-0001'
      },
      financials: {
        contractValue: contractVal,
        gst: gst,
        totalContractValue: totalContractVal,
        receivedAmount: receivedAmount,
        pendingAmount: pendingAmount,
        actualCost: actualCost,
        expectedProfit: expectedProfit,
        currentProfit: currentProfit,
        vendorPayable: 0,
        writtenOff: 0,
        loss: 0,
      },
      health: {
        schedule: dbProject.progress >= 50 ? 90 : 100,
        budget: actualCost <= contractVal ? 95 : 60,
        execution: dbProject.progress || 0,
        procurement: 80,
        payment: totalContractVal > 0 ? Math.min(100, Math.round((receivedAmount / totalContractVal) * 100)) : 0,
        overall: (actualCost > contractVal ? 'AT RISK' : 'ON TRACK') as any,
      },
      alerts: [],
    };
  }, [dbProject]);

  // Tasks from DB or fallback
  const tasks = dbProject?.tasks?.length > 0
    ? dbProject.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        assignee: t.assignee?.user?.name || 'Unassigned',
        stage: 'Execution',
        priority: t.priority || 'Medium',
        status: t.status === 'Completed' ? 'Completed' : t.status === 'In Progress' ? 'In Progress' : 'Pending',
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '2026-03-31'
      }))
    : mockTasks;

  // BOQ from DB or fallback
  const boq = dbProject?.boqItems?.length > 0
    ? dbProject.boqItems.map((b: any) => ({
        id: b.id,
        category: b.category,
        item: b.item,
        quantity: Number(b.quantity),
        unit: b.unit,
        rate: Number(b.rate),
        amount: Number(b.amount),
        completedQty: Number(b.completedQty || 0),
        status: b.status
      }))
    : mockBOQ;

  // Payments from DB or fallback
  const payments = dbProject?.payments?.length > 0
    ? dbProject.payments.map((p: any) => ({
        id: p.id,
        milestone: p.paymentType || 'Milestone Payment',
        amount: Number(p.amount),
        status: p.status,
        dueDate: p.date ? new Date(p.date).toISOString().split('T')[0] : '2026-03-15',
        paidDate: p.status === 'Paid' ? (p.date ? new Date(p.date).toISOString().split('T')[0] : '2026-03-01') : undefined
      }))
    : mockPayments;

  // Expenses from DB or fallback
  const expenses = dbProject?.expenses?.length > 0
    ? dbProject.expenses.map((e: any) => ({
        id: e.id,
        category: e.category,
        vendor: e.vendor?.name || 'Local Supplier',
        amount: Number(e.amount),
        date: e.date ? new Date(e.date).toISOString().split('T')[0] : '2026-03-01',
        description: e.description || ''
      }))
    : mockExpenses;

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <ProjectDetailsHeader project={project} />

      <main className="flex-1 w-full max-w-[1700px] mx-auto px-6 py-6">
        
        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 bg-[#151619] border border-[#292B30] p-1.5 rounded-xl overflow-x-auto no-scrollbar mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[12px] font-bold tracking-wide whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,196,0,0.2)]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'Overview' && <ProjectOverview project={project} />}
          {activeTab === 'Tasks' && <ProjectTasks tasks={tasks} />}
          {activeTab === 'BOQ' && <ProjectBOQ boq={boq} />}
          {activeTab === 'Procurement' && <ProjectProcurement procurement={mockProcurement} />}
          {activeTab === 'Site Visits' && <ProjectSiteVisits siteVisits={mockSiteVisits} location={project.location} customerName={project.customerName} />}
          {activeTab === 'Team' && <ProjectTeam team={mockTeam} />}
          {activeTab === 'Documents' && <ProjectDocuments documents={mockDocuments} />}
          {activeTab === 'Payments' && <ProjectPayments payments={payments} financials={project.financials} />}
          {activeTab === 'Expenses' && <ProjectExpenses expenses={expenses} financials={project.financials} />}
          {activeTab === 'Issues' && <ProjectIssues issues={mockIssues} />}
          {activeTab === 'Timeline' && <ProjectTimeline timeline={mockTimeline} />}

          {['Reports'].includes(activeTab) && (
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-8 text-center text-gray-500">
              <h2 className="text-white text-lg font-bold mb-2">{activeTab}</h2>
              <p className="text-[13px]">This section is under construction.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
