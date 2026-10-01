'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import ParksHeader from './components/ParksHeader';
import ParksSummaryCards from './components/ParksSummaryCards';
import ParksPipeline from './components/ParksPipeline';
import ParksFilters from './components/ParksFilters';
import LandscapeTable from './components/LandscapeTable';
import CreateLandscapeModal from './components/CreateLandscapeModal';
import ScheduleMaintenanceModal from './components/ScheduleMaintenanceModal';
import SiteInspectionModal from './components/SiteInspectionModal';
import { ParkStage, mockParks } from './data/mock';

export default function ParksClient({ initialLandscapes = [] }: { initialLandscapes?: any[] }) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<ParkStage | null>(null);
  
  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setActiveStage(null);
  };

  const handleParkClick = (id: string) => {
    router.push(`/parks/${id}`);
  };

  // Map DB landscapes (or mock fallback if DB has no records yet)
  const mappedParks = useMemo(() => {
    if (!initialLandscapes || initialLandscapes.length === 0) {
      return mockParks;
    }

    return initialLandscapes.map(dbLand => {
      const val = Number(dbLand.value || 0);
      return {
        id: dbLand.landscapeNumber || dbLand.id,
        dbId: dbLand.id,
        projectId: dbLand.project?.name || dbLand.projectId || 'N/A',
        name: dbLand.name,
        customerName: dbLand.customer?.name || 'Unknown',
        customerCode: dbLand.customer?.customerCode || `CUST-${(dbLand.customerId || '').substring(0, 4)}`,
        type: dbLand.type || 'Residential Garden',
        location: dbLand.location || 'Chennai, TN',
        area: '2,500 sq.ft',
        manager: dbLand.manager?.user?.name || 'Rahul S A',
        supervisor: 'Mukesh V',
        progress: dbLand.progress || 0,
        stage: (dbLand.stage || 'ENQUIRY').toUpperCase() as ParkStage,
        status: (dbLand.status || 'ACTIVE').toUpperCase() as any,
        startDate: dbLand.startDate ? new Date(dbLand.startDate).toISOString().split('T')[0] : '2026-09-01',
        expectedCompletion: dbLand.expectedCompletion ? new Date(dbLand.expectedCompletion).toISOString().split('T')[0] : '2026-10-31',
        nextMaintenance: dbLand.nextMaintenanceDate ? new Date(dbLand.nextMaintenanceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: dbLand.priority || 'Medium',
        crmRefs: {
          leadId: dbLand.lead?.leadNumber || dbLand.leadId || 'MIN-LEAD-2026-0001',
          dealId: 'DEAL-2026-0001',
          quoteId: 'QT-2026-0001',
        },
        financials: {
          contractValue: val,
          actualCost: Math.round(val * 0.6),
          receivedAmount: Math.round(val * 0.7),
          balance: Math.round(val * 0.3),
          expectedProfit: Math.round(val * 0.4),
          currentProfit: Math.round(val * 0.1),
        },
        health: {
          plants: dbLand.health || 90,
          irrigation: dbLand.health || 90,
          lawn: dbLand.health || 90,
          lighting: 95,
          maintenance: 90,
          overall: dbLand.health || 90,
          status: (dbLand.healthStatus || 'HEALTHY').toUpperCase() as any
        },
        alerts: []
      };
    });
  }, [initialLandscapes]);

  // Filter parks
  const filteredParks = useMemo(() => {
    return mappedParks.filter(p => {
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
      if (filters.manager && p.manager !== filters.manager) return false;
      if (filters.priority && p.priority !== filters.priority) return false;

      return true;
    });
  }, [mappedParks, search, filters, activeStage]);

  // CSV Export Functionality
  const handleExport = () => {
    const headers = ['Landscape ID', 'Landscape', 'Customer', 'Project', 'Location', 'Manager', 'Stage', 'Progress', 'Value', 'Health', 'Status'];
    const rows = filteredParks.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.customerName}"`,
      `"${p.projectId}"`,
      `"${p.location}"`,
      `"${p.manager}"`,
      p.stage,
      `${p.progress}%`,
      p.financials.contractValue,
      `${p.health.overall}%`,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parks_landscapes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <main className="flex-1 w-full max-w-[1700px] mx-auto">
        <ParksHeader 
          onNewLandscape={() => setShowNewModal(true)}
          onScheduleMaintenance={() => setShowMaintenanceModal(true)}
          onSiteInspection={() => setShowInspectionModal(true)}
          onExport={handleExport}
        />
        
        {activeTab === 'Overview' && (
          <>
            <ParksSummaryCards landscapes={mappedParks} />
            <ParksPipeline 
              landscapes={mappedParks}
              activeStage={activeStage} 
              onStageClick={setActiveStage} 
            />
          </>
        )}

        <div className="px-6 pb-10">
          <ParksFilters 
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="mt-4">
            <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-4 mt-6">ACTIVE LANDSCAPES</h2>
            <LandscapeTable 
              parks={filteredParks} 
              onParkClick={(id) => {
                const target: any = mappedParks.find(p => p.id === id);
                handleParkClick(target?.dbId || id);
              }} 
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNewModal && <CreateLandscapeModal onClose={() => setShowNewModal(false)} />}
      {showMaintenanceModal && <ScheduleMaintenanceModal landscapes={initialLandscapes} onClose={() => setShowMaintenanceModal(false)} />}
      {showInspectionModal && <SiteInspectionModal landscapes={initialLandscapes} onClose={() => setShowInspectionModal(false)} />}
    </div>
  );
}

