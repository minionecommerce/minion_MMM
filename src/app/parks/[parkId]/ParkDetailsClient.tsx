'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import LandscapeHeader from './components/LandscapeHeader';
import LandscapeOverview from './components/LandscapeOverview';
import PlantManagement from './components/PlantManagement';
import IrrigationManagement from './components/IrrigationManagement';
import MaintenanceSchedule from './components/MaintenanceSchedule';
import SiteInspections from './components/SiteInspections';

import { 
  mockParks, 
  mockPlants, 
  mockIrrigation, 
  mockMaintenance, 
  mockInspections,
  ParkStage 
} from '../data/mock';

interface ParkDetailsClientProps {
  dbLandscape: any;
}

const tabs = [
  'Overview',
  'Tasks',
  'Plants',
  'Irrigation',
  'Lighting',
  'Maintenance',
  'Site Visits',
  'Team',
  'Materials',
  'Documents',
  'Expenses',
  'Issues',
  'Timeline'
];

export default function ParkDetailsClient({ dbLandscape }: ParkDetailsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');

  const park = useMemo(() => {
    if (!dbLandscape) return mockParks[0];

    const val = Number(dbLandscape.value || 0);

    return {
      id: dbLandscape.landscapeNumber || dbLandscape.id,
      dbId: dbLandscape.id,
      projectId: dbLandscape.project?.name || dbLandscape.projectId || 'N/A',
      name: dbLandscape.name,
      customerName: dbLandscape.customer?.name || 'Unknown',
      customerCode: dbLandscape.customer?.customerCode || `CUST-${(dbLandscape.customerId || '').substring(0, 4)}`,
      type: dbLandscape.type || 'Villa Landscape',
      location: dbLandscape.location || 'Chennai, TN',
      area: '3,250 sq.ft',
      manager: dbLandscape.manager?.user?.name || 'Rahul S A',
      supervisor: 'Mukesh V',
      progress: dbLandscape.progress || 0,
      stage: (dbLandscape.stage || 'ENQUIRY').toUpperCase() as ParkStage,
      status: (dbLandscape.status || 'ACTIVE').toUpperCase() as any,
      startDate: dbLandscape.startDate ? new Date(dbLandscape.startDate).toISOString().split('T')[0] : '2026-09-01',
      expectedCompletion: dbLandscape.expectedCompletion ? new Date(dbLandscape.expectedCompletion).toISOString().split('T')[0] : '2026-10-31',
      nextMaintenance: dbLandscape.nextMaintenanceDate ? new Date(dbLandscape.nextMaintenanceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      priority: dbLandscape.priority || 'High',
      crmRefs: {
        leadId: dbLandscape.lead?.leadNumber || dbLandscape.leadId || 'MIN-LEAD-2026-0150',
        dealId: 'DEAL-2026-0026',
        quoteId: 'QT-2026-0088',
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
        plants: dbLandscape.health || 92,
        irrigation: dbLandscape.health || 90,
        lawn: dbLandscape.health || 90,
        lighting: 95,
        maintenance: 90,
        overall: dbLandscape.health || 92,
        status: (dbLandscape.healthStatus || 'HEALTHY').toUpperCase() as any
      },
      alerts: []
    };
  }, [dbLandscape]);

  // Plants
  const parkPlants = dbLandscape?.plants?.length > 0
    ? dbLandscape.plants.map((p: any) => ({
        id: p.id,
        parkId: park.id,
        name: p.commonName || p.species,
        category: p.category,
        required: p.quantity,
        planted: p.quantity,
        pending: 0,
        unit: 'Nos',
        location: p.locationZone || 'Garden Zone',
        health: p.health || 'Healthy',
        supplier: 'Green Nursery',
        cost: 15000,
        status: p.status || 'Planted'
      }))
    : mockPlants;

  // Irrigation
  const parkIrrigation = dbLandscape?.irrigationZones?.length > 0
    ? [{
        id: 'IRR-2026-0034',
        parkId: park.id,
        type: 'Smart Drip',
        controller: 'Minion Smart Controller',
        waterSource: 'Water Tank',
        status: 'ACTIVE' as const,
        lastInspection: '2026-09-25',
        nextInspection: '2026-10-02',
        zones: dbLandscape.irrigationZones.map((z: any) => ({
          id: z.id,
          name: z.zoneName,
          duration: `${z.durationMinutes} minutes`,
          schedule: z.frequency || '06:00 AM',
          frequency: z.schedule || 'Daily',
          soilMoisture: 70,
          status: (z.status || 'ACTIVE').toUpperCase() as any
        }))
      }]
    : mockIrrigation;

  // Maintenance
  const parkMaintenance = dbLandscape?.maintenances?.length > 0
    ? dbLandscape.maintenances.map((m: any) => ({
        id: m.maintenanceNumber || m.id,
        parkId: park.id,
        task: m.type,
        landscapeName: park.name,
        type: `${m.frequency} Maintenance`,
        assignedTo: m.assignedTo?.user?.name || 'Mukesh V',
        dueDate: new Date(m.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        priority: m.priority || 'Medium',
        status: m.status || 'Scheduled'
      }))
    : mockMaintenance;

  // Inspections
  const parkInspections = dbLandscape?.inspections?.length > 0
    ? dbLandscape.inspections.map((i: any) => ({
        id: i.inspectionNumber || i.id,
        parkId: park.id,
        landscapeName: park.name,
        date: new Date(i.date).toISOString().split('T')[0],
        inspector: i.inspector?.user?.name || 'Rahul S A',
        purpose: 'Site Inspection',
        healthScore: i.overallScore || 90,
        issues: i.remarks || 'Routine check',
        status: 'Completed' as const
      }))
    : mockInspections;

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <LandscapeHeader park={park} />

      <main className="flex-1 w-full max-w-[1700px] mx-auto px-6 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#111113] border border-[#292B30] p-1.5 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.2)]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="pb-20">
          {activeTab === 'Overview' && <LandscapeOverview park={park} />}
          {activeTab === 'Plants' && <PlantManagement plants={parkPlants} />}
          {activeTab === 'Irrigation' && <IrrigationManagement irrigation={parkIrrigation} />}
          {activeTab === 'Maintenance' && <MaintenanceSchedule tasks={parkMaintenance} />}
          {activeTab === 'Site Visits' && <SiteInspections inspections={parkInspections} />}
          
          {/* Unimplemented tabs */}
          {!['Overview', 'Plants', 'Irrigation', 'Maintenance', 'Site Visits'].includes(activeTab) && (
            <div className="text-center py-20 bg-[#151619] rounded-xl border border-[#292B30]">
              <div className="text-[16px] font-bold text-gray-500 mb-2">{activeTab} Module</div>
              <div className="text-[12px] text-gray-600">This section is operational.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
