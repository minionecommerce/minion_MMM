'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import ProjectsHeader from './components/ProjectsHeader';
import ProjectSummaryCards from './components/ProjectSummaryCards';
import ProjectPipeline from './components/ProjectPipeline';
import ProjectFilters from './components/ProjectFilters';
import ProjectTable from './components/ProjectTable';
import CreateProjectModal from './components/CreateProjectModal';
import { ProjectStage } from './data/mock';

export default function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStage, setActiveStage] = useState<ProjectStage | null>(null);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Active');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setActiveStage(null);
  };

  const handleProjectClick = (id: string) => {
    router.push(`/projects/${id}`);
  };

  // Map all DB projects to UI project representation
  const mappedProjects = useMemo(() => {
    return initialProjects.map(dbProj => {
      const contractVal = Number(dbProj.value || 0);
      const gst = contractVal * 0.18;
      const totalContractVal = contractVal + gst;

      const actualCost = (dbProj.expenses || []).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
      const receivedAmount = (dbProj.payments || [])
        .filter((p: any) => p.paymentType === 'Inbound' || p.status === 'Completed' || p.status === 'Paid')
        .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

      const pendingAmount = Math.max(0, totalContractVal - receivedAmount);
      const expectedProfit = Math.round(contractVal * 0.25);
      const currentProfit = receivedAmount - actualCost;

      return {
        id: dbProj.id,
        name: dbProj.name,
        customerName: dbProj.customer?.name || 'Unknown',
        customerCode: dbProj.customer?.customerCode || `CUST-${dbProj.customerId?.substring(0,4)}`,
        type: dbProj.type || 'Other',
        location: dbProj.lead?.siteLocation || dbProj.customer?.address || 'Chennai, TN',
        propertyType: dbProj.lead?.propertyType || 'Villa',
        projectManager: dbProj.manager?.user?.name || dbProj.manager?.designation || 'Dinesh Subramanian',
        projectCoordinator: 'Rahul S A',
        salesExecutive: dbProj.lead?.salesExecutive?.user?.name || 'Mukesh V',
        progress: dbProj.progress || 0,
        stage: (dbProj.status === 'Completed' ? 'Completed' : dbProj.status === 'Planning' ? 'Planning' : 'Execution') as any,
        status: dbProj.status || 'Active',
        startDate: dbProj.startDate ? new Date(dbProj.startDate).toISOString().split('T')[0] : 'TBD',
        expectedCompletion: dbProj.expectedEndDate ? new Date(dbProj.expectedEndDate).toISOString().split('T')[0] : 'TBD',
        priority: (dbProj.lead?.priority || 'Medium') as any,
        crmRefs: {
          leadId: dbProj.lead?.leadNumber || dbProj.leadId || 'MIN-LEAD-2026-0001',
          dealId: dbProj.deal?.dealNumber || dbProj.dealId || 'DEAL-2026-0001',
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
          schedule: dbProj.progress >= 50 ? 90 : 100,
          budget: actualCost <= contractVal ? 95 : 60,
          execution: dbProj.progress || 0,
          procurement: 80,
          payment: totalContractVal > 0 ? Math.min(100, Math.round((receivedAmount / totalContractVal) * 100)) : 0,
          overall: (actualCost > contractVal ? 'AT RISK' : 'ON TRACK') as any,
        },
        alerts: [],
      };
    });
  }, [initialProjects]);

  // Filter projects for table
  const filteredProjects = useMemo(() => {
    return mappedProjects.filter(p => {
      // Tab filter
      if (activeTab === 'Active' && p.status !== 'Active') return false;
      if (activeTab === 'Planning' && p.stage !== 'Planning') return false;
      if (activeTab === 'Execution' && p.stage !== 'Execution') return false;
      if (activeTab === 'At Risk' && p.status !== 'At Risk') return false;
      if (activeTab === 'Completed' && p.status !== 'Completed') return false;
      if (activeTab === 'On Hold' && p.status !== 'On Hold') return false;
      
      // Stage visual filter
      if (activeStage && p.stage !== activeStage) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.id.toLowerCase().includes(q) &&
          !p.customerName.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q)
        ) return false;
      }

      // Advanced filters
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.manager && p.projectManager !== filters.manager) return false;
      if (filters.priority && p.priority !== filters.priority) return false;
      
      if (filters.paymentStatus) {
        const percent = p.financials.receivedAmount / (p.financials.totalContractValue || 1);
        const pStatus = percent >= 1 ? 'Paid' : percent > 0 ? 'Partially Paid' : 'Pending';
        if (filters.paymentStatus !== pStatus) return false;
      }

      return true;
    });
  }, [mappedProjects, search, filters, activeTab, activeStage]);

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <main className="flex-1 w-full max-w-[1700px] mx-auto">
        <ProjectsHeader 
          onNewProject={() => setShowCreateModal(true)}
          onAddTask={() => {}} 
          onSiteVisit={() => {}} 
        />
        
        <ProjectSummaryCards projects={mappedProjects} />
        
        <ProjectPipeline 
          projects={mappedProjects}
          activeStage={activeStage} 
          onStageClick={setActiveStage} 
        />

        <div className="px-6 pb-10">
          <ProjectFilters 
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="mt-4">
            <ProjectTable 
              projects={filteredProjects} 
              onProjectClick={handleProjectClick} 
            />
          </div>
        </div>
      </main>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

