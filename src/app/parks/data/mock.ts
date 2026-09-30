export type ParkStage = 'ENQUIRY' | 'DESIGN' | 'SITE PREPARATION' | 'PLANTATION' | 'IRRIGATION' | 'LANDSCAPING' | 'LIGHTING' | 'MAINTENANCE' | 'COMPLETED';
export type ParkType = 'Residential Garden' | 'Villa Landscape' | 'Terrace Garden' | 'Apartment Landscape' | 'Corporate Landscape' | 'Commercial Landscape' | 'Restaurant Outdoor' | 'Park' | 'Vertical Garden' | 'Rooftop Garden' | 'Balcony Garden' | 'Public Space' | 'Farm / Agricultural Landscape' | 'Other';

export interface ParkFinancials {
  contractValue: number;
  actualCost: number;
  receivedAmount: number;
  balance: number;
  expectedProfit: number;
  currentProfit: number;
}

export interface ParkHealth {
  plants: number;
  irrigation: number;
  lawn: number;
  lighting: number;
  maintenance: number;
  overall: number;
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
}

export interface Park {
  id: string;
  projectId: string;
  name: string;
  customerName: string;
  customerCode: string;
  type: ParkType;
  location: string;
  area: string;
  manager: string;
  supervisor: string;
  progress: number;
  stage: ParkStage;
  status: 'ACTIVE' | 'ON HOLD' | 'COMPLETED';
  startDate: string;
  expectedCompletion: string;
  nextMaintenance: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  crmRefs: {
    leadId: string;
    dealId: string;
    quoteId: string;
  };
  financials: ParkFinancials;
  health: ParkHealth;
  alerts: string[];
}

export interface Plant {
  id: string;
  parkId: string;
  name: string;
  category: string;
  required: number;
  planted: number;
  pending: number;
  unit: string;
  location: string;
  health: 'Healthy' | 'Needs Water' | 'Nutrient Deficiency' | 'Pest Issue' | 'Disease' | 'Damaged' | 'Dead' | 'Replacement Required';
  supplier: string;
  cost: number;
  status: 'Planned' | 'Ordered' | 'Received' | 'Planted' | 'Replaced' | 'Dead' | 'Maintenance Required';
}

export interface IrrigationZone {
  id: string;
  name: string;
  duration: string;
  schedule: string;
  frequency: string;
  soilMoisture: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FAULT';
}

export interface IrrigationSystem {
  id: string;
  parkId: string;
  type: string;
  controller: string;
  waterSource: string;
  status: 'ACTIVE' | 'INACTIVE' | 'FAULT';
  lastInspection: string;
  nextInspection: string;
  zones: IrrigationZone[];
}

export interface MaintenanceTask {
  id: string;
  parkId: string;
  task: string;
  landscapeName: string;
  type: string;
  assignedTo: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Overdue';
}

export interface SiteInspection {
  id: string;
  parkId: string;
  landscapeName: string;
  date: string;
  inspector: string;
  purpose: string;
  healthScore: number;
  issues: string;
  status: 'Open' | 'Completed';
}

export interface ParkTimelineEvent {
  id: string;
  parkId: string;
  date: string;
  time: string;
  user: string;
  action: string;
  notes?: string;
}

export const parkStages: ParkStage[] = ['ENQUIRY', 'DESIGN', 'SITE PREPARATION', 'PLANTATION', 'IRRIGATION', 'LANDSCAPING', 'LIGHTING', 'MAINTENANCE', 'COMPLETED'];

// --- MOCK DATA ---

export const mockParks: Park[] = [
  {
    id: 'LAND-2026-0018',
    projectId: 'PRJ-2026-0049',
    name: 'GREEN VILLA',
    customerName: 'Priya Homes',
    customerCode: 'CUST-085',
    type: 'Villa Landscape',
    location: 'OMR, Chennai',
    area: '3,250 sq.ft',
    manager: 'Rahul S A',
    supervisor: 'Mukesh V',
    progress: 72,
    stage: 'PLANTATION',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    expectedCompletion: '2026-10-08',
    nextMaintenance: '2026-10-02',
    priority: 'High',
    crmRefs: {
      leadId: 'MIN-LEAD-2026-0150',
      dealId: 'DEAL-2026-0026',
      quoteId: 'QT-2026-0088',
    },
    financials: {
      contractValue: 680000,
      actualCost: 392000,
      receivedAmount: 408000,
      balance: 272000,
      expectedProfit: 288000,
      currentProfit: 184000,
    },
    health: {
      plants: 94,
      irrigation: 88,
      lawn: 92,
      lighting: 96,
      maintenance: 90,
      overall: 92,
      status: 'HEALTHY'
    },
    alerts: [
      '⚠ Minor irrigation leakage in Zone 2',
      '✓ Monthly inspection completed'
    ]
  },
  {
    id: 'LAND-2026-0019',
    projectId: 'PRJ-2026-0051',
    name: 'KUMAR TERRACE',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUST-082',
    type: 'Terrace Garden',
    location: 'Anna Nagar, Chennai',
    area: '1,200 sq.ft',
    manager: 'Mukesh V',
    supervisor: 'Rahul S A',
    progress: 84,
    stage: 'LANDSCAPING',
    status: 'ACTIVE',
    startDate: '2026-09-10',
    expectedCompletion: '2026-10-05',
    nextMaintenance: '2026-09-30',
    priority: 'Medium',
    crmRefs: {
      leadId: 'MIN-LEAD-2026-0148',
      dealId: 'DEAL-2026-0024',
      quoteId: 'QT-2026-0084',
    },
    financials: {
      contractValue: 240000,
      actualCost: 110000,
      receivedAmount: 180000,
      balance: 60000,
      expectedProfit: 130000,
      currentProfit: 70000,
    },
    health: {
      plants: 98,
      irrigation: 100,
      lawn: 90,
      lighting: 95,
      maintenance: 96,
      overall: 96,
      status: 'HEALTHY'
    },
    alerts: [
      '⚠ Maintenance due tomorrow'
    ]
  }
];

export const mockPlants: Plant[] = [
  { id: 'PLT-01', parkId: 'LAND-2026-0018', name: 'Areca Palm', category: 'Indoor / Outdoor', required: 25, planted: 20, pending: 5, unit: 'Nos', location: 'Main Entrance', health: 'Healthy', supplier: 'Green Nursery', cost: 18000, status: 'Planted' },
  { id: 'PLT-02', parkId: 'LAND-2026-0018', name: 'Bougainvillea', category: 'Flowering', required: 18, planted: 18, pending: 0, unit: 'Nos', location: 'Boundary', health: 'Healthy', supplier: 'Garden Vendor', cost: 12500, status: 'Planted' },
  { id: 'PLT-03', parkId: 'LAND-2026-0018', name: 'Mexican Grass', category: 'Lawn', required: 1500, planted: 1500, pending: 0, unit: 'Sq.ft', location: 'Front Yard', health: 'Needs Water', supplier: 'Green Nursery', cost: 45000, status: 'Planted' },
];

export const mockIrrigation: IrrigationSystem[] = [
  {
    id: 'IRR-2026-0034',
    parkId: 'LAND-2026-0018',
    type: 'Smart Drip',
    controller: 'Minion Smart Controller',
    waterSource: 'Water Tank',
    status: 'ACTIVE',
    lastInspection: '2026-09-25',
    nextInspection: '2026-10-02',
    zones: [
      { id: 'Z1', name: 'Front Lawn', duration: '15 minutes', schedule: '06:00 AM', frequency: 'Daily', soilMoisture: 68, status: 'ACTIVE' },
      { id: 'Z2', name: 'Boundary Planters', duration: '10 minutes', schedule: '06:30 AM', frequency: 'Daily', soilMoisture: 72, status: 'ACTIVE' }
    ]
  }
];

export const mockMaintenance: MaintenanceTask[] = [
  { id: 'MT-01', parkId: 'LAND-2026-0018', task: 'Lawn Trimming', landscapeName: 'Green Villa', type: 'Weekly Maintenance', assignedTo: 'Mukesh V', dueDate: 'Today', priority: 'Medium', status: 'Pending' },
  { id: 'MT-02', parkId: 'LAND-2026-0019', task: 'Irrigation Inspection', landscapeName: 'Kumar Terrace', type: 'System Check', assignedTo: 'Vignesh', dueDate: 'Tomorrow', priority: 'High', status: 'Scheduled' },
];

export const mockInspections: SiteInspection[] = [
  { id: 'INS-2026-0042', parkId: 'LAND-2026-0018', landscapeName: 'Green Villa', date: '2026-09-29', inspector: 'Rahul S A', purpose: 'Monthly Landscape Inspection', healthScore: 92, issues: 'Minor irrigation leakage', status: 'Open' },
];

export const mockTimeline: ParkTimelineEvent[] = [
  { id: 'PTL-1', parkId: 'LAND-2026-0018', date: '2026-09-29', time: '11:00 AM', user: 'Rahul S A', action: 'Monthly inspection completed', notes: 'All healthy, minor drip issue reported' },
  { id: 'PTL-2', parkId: 'LAND-2026-0018', date: '2026-09-28', time: '02:30 PM', user: 'Mukesh V', action: '20 plants planted', notes: 'Areca palms installed at entrance' },
  { id: 'PTL-3', parkId: 'LAND-2026-0018', date: '2026-09-27', time: '04:00 PM', user: 'Vignesh', action: 'Irrigation system tested', notes: 'All zones working' },
];
