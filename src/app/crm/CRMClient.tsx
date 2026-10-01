'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import CRMHeader from './components/CRMHeader';
import CRMSummaryCards from './components/CRMSummaryCards';
import CRMPipeline from './components/CRMPipeline';
import CRMAnalytics from './components/CRMAnalytics';
import CRMSearchFilters from './components/CRMSearchFilters';
import LeadTable from './components/LeadTable';
import LeadDetailsDrawer from './components/LeadDetailsDrawer';
import CreateLeadModal from './components/CreateLeadModal';
import CreateFollowUpModal from './components/CreateFollowUpModal';
import ScheduleSiteVisitModal from './components/ScheduleSiteVisitModal';
import FollowUps from './components/FollowUps';
import SiteVisits from './components/SiteVisits';
import Quotes from './components/Quotes';
import Deals from './components/Deals';
import Customers from './components/Customers';
import QuickActions from './components/QuickActions';
import ImportModal from './components/ImportModal';

type WorkspaceTab = 'Leads' | 'Customers' | 'Deals' | 'Follow-ups' | 'Site Visits' | 'Quotes';

const workspaceTabs: WorkspaceTab[] = ['Leads', 'Customers', 'Deals', 'Follow-ups', 'Site Visits', 'Quotes'];

const pipelineToStatus: Record<string, string[]> = {
  'NEW': ['New'],
  'CONTACTED': ['Contacted'],
  'REQUIREMENTS': ['Requirements Collected'],
  'PRELIM QUOTE': ['Preliminary Quote Sent'],
  'FOLLOW-UP': ['Follow-up'],
  'SITE VISIT': ['Site Visit Scheduled', 'Site Visit Completed'],
  'FINAL QUOTE': ['Final Quote Sent'],
  'NEGOTIATION': ['Negotiation'],
  'DEAL WON': ['Won'],
  'PROJECT': ['Won'],
};

interface CRMClientProps {
  initialLeads: any[];
  dashboardData: any;
  analytics: any;
  employees: any[];
  followUps: any[];
  siteVisits: any[];
  deals: any[];
  quotes: any[];
}

export default function CRMClient({
  initialLeads,
  dashboardData,
  analytics,
  employees,
  followUps,
  siteVisits,
  deals,
  quotes,
}: CRMClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('Leads');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateFollowup, setShowCreateFollowup] = useState(false);
  const [showScheduleSiteVisit, setShowScheduleSiteVisit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setPipelineFilter(null);
  };

  const refreshData = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Map DB leads to UI format
  const mappedLeads = useMemo(() => {
    return initialLeads.map(dbLead => ({
      id: dbLead.id,
      leadNumber: dbLead.leadNumber || dbLead.id.slice(0, 8).toUpperCase(),
      customerName: dbLead.customer?.name || 'Unknown',
      customerType: dbLead.customer?.customerType || 'Individual',
      phone: dbLead.customer?.phone || 'N/A',
      email: dbLead.customer?.email || 'N/A',
      whatsapp: dbLead.customer?.phone || '',
      siteLocation: dbLead.siteLocation || dbLead.customer?.address || 'N/A',
      propertyType: dbLead.propertyType || 'Residential',
      budgetRange: dbLead.budgetRange || 'TBD',
      requirement: dbLead.requirement || 'TBD',
      stage: dbLead.status || 'New',
      status: dbLead.status === 'Won' ? 'Won' : dbLead.status === 'Lost' ? 'Lost' : 'Active',
      source: dbLead.source || 'Website',
      priority: dbLead.priority || 'Medium',
      services: dbLead.services ? JSON.parse(dbLead.services) : [],
      salesExecutive: dbLead.salesExecutive?.user?.name || 'Unassigned',
      salesExecutiveId: dbLead.salesExecutiveId,
      enquiryDate: dbLead.enquiryDate ? new Date(dbLead.enquiryDate).toLocaleDateString('en-IN') : 'TBD',
      lastContact: dbLead.lastContactedAt
        ? new Date(dbLead.lastContactedAt).toLocaleDateString('en-IN')
        : new Date(dbLead.updatedAt).toLocaleDateString('en-IN'),
      nextAction: dbLead.nextAction || 'Call Customer',
      nextActionDate: dbLead.nextActionDate ? new Date(dbLead.nextActionDate).toLocaleDateString('en-IN') : 'TBD',
      notes: dbLead.notes || '',
      probability: dbLead.deals?.[0]?.probability || 50,
      expectedValue: dbLead.expectedValue ? Number(dbLead.expectedValue) : null,
      prelimQuoteAmount: dbLead.prelimQuoteAmount ? Number(dbLead.prelimQuoteAmount) : undefined,
      prelimQuoteDate: dbLead.prelimQuoteDate ? new Date(dbLead.prelimQuoteDate).toLocaleDateString('en-IN') : undefined,
      prelimQuoteStatus: dbLead.prelimQuoteStatus || 'Not Sent',
      createdDate: new Date(dbLead.createdAt).toLocaleDateString('en-IN'),
      dealId: dbLead.deals?.[0]?.id,
      finalQuoteId: dbLead.quotes?.find((q: any) => q.type === 'Final')?.id,
      deals: dbLead.deals || [],
      quotes: dbLead.quotes || [],
      followUps: dbLead.followUps || [],
      siteVisits: dbLead.siteVisits || [],
      customerId: dbLead.customerId,
      // Timeline from audit logs (passed from drawer when opened)
      timeline: [],
    }));
  }, [initialLeads]);

  // Client-side filtering
  const filteredLeads = useMemo(() => {
    return mappedLeads.filter(lead => {
      if (search) {
        const q = search.toLowerCase();
        const inName = lead.customerName.toLowerCase().includes(q);
        const inId = lead.leadNumber?.toLowerCase().includes(q) || lead.id.toLowerCase().includes(q);
        const inPhone = lead.phone.includes(q);
        const inEmail = lead.email.toLowerCase().includes(q);
        const inLocation = lead.siteLocation.toLowerCase().includes(q);
        const inReq = lead.requirement.toLowerCase().includes(q);
        if (!inName && !inId && !inPhone && !inEmail && !inLocation && !inReq) return false;
      }

      if (filters.status && lead.stage !== filters.status) return false;
      if (filters.customerType && lead.customerType !== filters.customerType) return false;
      if (filters.source && lead.source !== filters.source) return false;
      if (filters.priority && lead.priority !== filters.priority) return false;

      if (pipelineFilter) {
        const statuses = pipelineToStatus[pipelineFilter];
        if (statuses && !statuses.includes(lead.stage)) return false;
      }

      return true;
    });
  }, [mappedLeads, search, filters, pipelineFilter]);

  const handleTabClick = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    if (tab === 'Leads' || tab === 'Customers') {
      setPipelineFilter(null);
    }
  };

  const handlePipelineClick = (stage: string | null) => {
    setPipelineFilter(stage);
    if (stage) setActiveTab('Leads');
  };

  const handleSummaryCardClick = (card: string) => {
    switch (card) {
      case 'TOTAL_LEADS':
        setActiveTab('Leads');
        setFilters({});
        break;
      case 'NEW_LEADS':
        setActiveTab('Leads');
        setFilters({ status: 'New' });
        break;
      case 'FOLLOW_UPS':
        setActiveTab('Follow-ups');
        break;
      case 'SITE_VISITS':
        setActiveTab('Site Visits');
        break;
      case 'ACTIVE_DEALS':
        setActiveTab('Deals');
        break;
      case 'WON_THIS_MONTH':
        setActiveTab('Deals');
        break;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <main className="flex-1 w-full max-w-[1700px] mx-auto">

        {/* Page Header */}
        <CRMHeader
          onNewLead={() => setShowCreateLead(true)}
          onNewFollowup={() => setShowCreateFollowup(true)}
          onNewQuote={() => { setActiveTab('Quotes'); }}
          onImport={() => setShowImport(true)}
        />

        {/* Summary Cards */}
        <CRMSummaryCards
          stats={dashboardData.stats}
          onCardClick={handleSummaryCardClick}
        />

        {/* Pipeline */}
        <CRMPipeline
          activeStage={pipelineFilter}
          onStageClick={handlePipelineClick}
          statusGroups={dashboardData.statusGroups || []}
        />

        {/* Analytics */}
        <CRMAnalytics analytics={analytics} />

        {/* Quick Actions */}
        <div className="px-6 pb-4">
          <QuickActions
            onNewLead={() => setShowCreateLead(true)}
            onNewFollowup={() => setShowCreateFollowup(true)}
            onScheduleSiteVisit={() => setShowScheduleSiteVisit(true)}
            onNewQuote={() => setActiveTab('Quotes')}
          />
        </div>

        {/* CRM Workspace */}
        <div className="px-6 pb-10">
          <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">

            {/* Tab Bar */}
            <div className="flex items-center gap-0 border-b border-[#292B30] bg-[#111113] overflow-x-auto no-scrollbar">
              {workspaceTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`px-5 py-3.5 text-[12px] font-semibold tracking-wide whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? 'text-yellow-400 border-yellow-400 bg-yellow-400/5'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5">

              {/* LEADS */}
              {activeTab === 'Leads' && (
                <>
                  <div className="mb-4">
                    <CRMSearchFilters
                      search={search}
                      onSearchChange={setSearch}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] text-gray-500">
                      Showing <span className="text-white font-semibold">{filteredLeads.length}</span> leads
                      {pipelineFilter && <span className="text-yellow-400"> · {pipelineFilter}</span>}
                      {search && <span className="text-yellow-400"> · "{search}"</span>}
                      {isPending && <span className="text-gray-600 ml-2">Refreshing...</span>}
                    </span>
                    {pipelineFilter && (
                      <button
                        onClick={() => setPipelineFilter(null)}
                        className="text-[11px] text-gray-600 hover:text-yellow-400 transition-colors"
                      >
                        Clear pipeline filter ×
                      </button>
                    )}
                  </div>
                  <LeadTable
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                    onRefresh={refreshData}
                  />
                </>
              )}

              {/* CUSTOMERS */}
              {activeTab === 'Customers' && (
                <Customers leads={mappedLeads} />
              )}

              {/* DEALS */}
              {activeTab === 'Deals' && (
                <Deals
                  deals={deals}
                  employees={employees}
                  onRefresh={refreshData}
                />
              )}

              {/* FOLLOW-UPS */}
              {activeTab === 'Follow-ups' && (
                <FollowUps
                  followUps={followUps}
                  onRefresh={refreshData}
                />
              )}

              {/* SITE VISITS */}
              {activeTab === 'Site Visits' && (
                <SiteVisits
                  siteVisits={siteVisits}
                  onRefresh={refreshData}
                />
              )}

              {/* QUOTES */}
              {activeTab === 'Quotes' && (
                <Quotes
                  quotes={quotes}
                  leads={initialLeads}
                  employees={employees}
                  onRefresh={refreshData}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        lead={selectedLead}
        employees={employees}
        onClose={() => setSelectedLead(null)}
        onRefresh={refreshData}
      />

      {/* Create Lead Modal */}
      {showCreateLead && (
        <CreateLeadModal
          employees={employees}
          onClose={() => setShowCreateLead(false)}
          onSuccess={() => {
            setShowCreateLead(false);
            refreshData();
          }}
        />
      )}

      {/* Create Follow-up Modal */}
      {showCreateFollowup && (
        <CreateFollowUpModal
          leads={initialLeads}
          employees={employees}
          onClose={() => setShowCreateFollowup(false)}
          onSuccess={() => {
            setShowCreateFollowup(false);
            setActiveTab('Follow-ups');
            refreshData();
          }}
        />
      )}

      {/* Schedule Site Visit Modal */}
      {showScheduleSiteVisit && (
        <ScheduleSiteVisitModal
          leads={initialLeads}
          employees={employees}
          onClose={() => setShowScheduleSiteVisit(false)}
          onSuccess={() => {
            setShowScheduleSiteVisit(false);
            setActiveTab('Site Visits');
            refreshData();
          }}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
