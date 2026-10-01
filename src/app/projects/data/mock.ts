export type ProjectStage = 'Planning' | 'Procurement' | 'Site Preparation' | 'Execution' | 'Quality Check' | 'Handover' | 'Completed';
export type ProjectStatus = 'Planning' | 'Active' | 'At Risk' | 'Critical' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectType = 'Smart Home Automation' | 'Interior Design' | 'Landscaping' | 'Landscaping + Automation' | 'Home Automation + Interiors' | 'Interior + Landscaping' | 'Complete Turnkey' | 'Commercial Interior' | 'Restaurant / Cafe' | 'Office' | 'Villa' | 'Apartment' | 'Builder Project' | 'Other';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export const projectStages: ProjectStage[] = ['Planning', 'Procurement', 'Site Preparation', 'Execution', 'Quality Check', 'Handover', 'Completed'];

export interface ProjectFinancials {
  contractValue: number;
  gst: number;
  totalContractValue: number;
  receivedAmount: number;
  pendingAmount: number;
  actualCost: number;
  expectedProfit: number;
  currentProfit: number;
  vendorPayable: number;
  writtenOff: number;
  loss: number;
}

export interface ProjectHealth {
  schedule: number;
  budget: number;
  execution: number;
  procurement: number;
  payment: number;
  overall: 'ON TRACK' | 'AT RISK' | 'CRITICAL';
}

export interface CRMReferences {
  leadId: string;
  dealId: string;
  quoteId: string;
}

export interface Project {
  id: string;
  name: string;
  customerName: string;
  customerCode: string;
  type: ProjectType;
  location: string;
  propertyType: string;
  projectManager: string;
  projectCoordinator: string;
  salesExecutive: string;
  progress: number;
  stage: ProjectStage;
  status: ProjectStatus;
  startDate: string;
  expectedCompletion: string;
  actualCompletion?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  crmRefs: CRMReferences;
  financials: ProjectFinancials;
  health: ProjectHealth;
  alerts: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  dueDate: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface BOQItem {
  id: string;
  projectId: string;
  category: string;
  item: string;
  quantity: number;
  unit: string;
  quotedAmount: number;
  actualCost: number;
  variance: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  vendorCost: number;
  paid: number;
}

export interface ProcurementItem {
  id: string;
  projectId: string;
  material: string;
  boqCategory: string;
  vendor: string;
  requiredQty: number;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  requiredDate: string;
  purchaseStatus: 'Requested' | 'Quotation' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid';
}

export interface SiteVisit {
  id: string;
  projectId: string;
  date: string;
  purpose: string;
  assignedTo: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface TeamMember {
  id: string;
  projectId: string;
  role: string;
  name: string;
  taskCount: number;
  responsibility: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  uploadedDate: string;
  uploadedBy: string;
}

export interface Payment {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: 'Received' | 'Pending' | 'Failed';
}

export interface Expense {
  id: string;
  projectId: string;
  date: string;
  item: string;
  category: string;
  vendor: string;
  amount: number;
  paymentStatus: 'Paid' | 'Pending';
  status: 'Approved' | 'Pending' | 'Rejected';
  pprId: string;
  boqItem: string;
  remarks: string;
  description: string;
  submittedBy: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  reportedBy: string;
  createdDate: string;
  dateReported: string;
  dueDate: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  date: string;
  time: string;
  user: string;
  action: string;
  description: string;
}
export type ActivityHistory = TimelineEvent;

// --- MOCK DATA ---

export const mockProjects: Project[] = [
  {
    id: 'PRJ-2026-0048',
    name: 'KUMAR RESIDENCE',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUST-082',
    type: 'Home Automation + Interiors',
    location: 'Anna Nagar, Chennai',
    propertyType: 'Villa',
    projectManager: 'Dinesh Subramanian',
    projectCoordinator: 'Rahul S A',
    salesExecutive: 'Priya',
    progress: 78,
    stage: 'Execution',
    status: 'Active',
    startDate: '2026-08-15',
    expectedCompletion: '2026-10-04',
    priority: 'High',
    crmRefs: {
      leadId: 'MIN-LEAD-2026-0148',
      dealId: 'DEAL-2026-0024',
      quoteId: 'QT-2026-0084',
    },
    financials: {
      contractValue: 840000,
      gst: 151200,
      totalContractValue: 991200,
      receivedAmount: 546000,
      pendingAmount: 294000,
      actualCost: 485000,
      expectedProfit: 355000,
      currentProfit: 261000,
      vendorPayable: 112000,
      writtenOff: 0,
      loss: 0,
    },
    health: {
      schedule: 82,
      budget: 91,
      execution: 78,
      procurement: 70,
      payment: 65,
      overall: 'ON TRACK',
    },
    alerts: [
      '⚠ Material delivery delayed by 2 days',
      '⚠ Payment pending ₹2,40,000',
      '✓ Site measurement completed',
    ],
  },
  {
    id: 'PRJ-2026-0049',
    name: 'GREEN VILLA',
    customerName: 'Priya Homes',
    customerCode: 'CUST-085',
    type: 'Landscaping + Automation',
    location: 'OMR, Chennai',
    propertyType: 'Builder Project',
    projectManager: 'Rahul S A',
    projectCoordinator: 'Mukesh V',
    salesExecutive: 'Jaya',
    progress: 64,
    stage: 'Execution',
    status: 'At Risk',
    startDate: '2026-09-01',
    expectedCompletion: '2026-10-08',
    priority: 'Medium',
    crmRefs: {
      leadId: 'MIN-LEAD-2026-0150',
      dealId: 'DEAL-2026-0026',
      quoteId: 'QT-2026-0088',
    },
    financials: {
      contractValue: 680000,
      gst: 122400,
      totalContractValue: 802400,
      receivedAmount: 272000,
      pendingAmount: 408000,
      actualCost: 320000,
      expectedProfit: 360000,
      currentProfit: -48000,
      vendorPayable: 150000,
      writtenOff: 0,
      loss: 0,
    },
    health: {
      schedule: 60,
      budget: 85,
      execution: 64,
      procurement: 90,
      payment: 40,
      overall: 'AT RISK',
    },
    alerts: [
      '⚠ 3 tasks overdue',
      '⚠ Payment overdue by 5 days',
    ],
  },
  {
    id: 'PRJ-2026-0050',
    name: 'SRI RESIDENCY',
    customerName: 'Arun Kumar',
    customerCode: 'CUST-091',
    type: 'Smart Home Automation',
    location: 'Velachery, Chennai',
    propertyType: 'Apartment',
    projectManager: 'Mukesh V',
    projectCoordinator: 'Dinesh Subramanian',
    salesExecutive: 'Dinesh',
    progress: 42,
    stage: 'Procurement',
    status: 'Active',
    startDate: '2026-09-10',
    expectedCompletion: '2026-10-15',
    priority: 'High',
    crmRefs: {
      leadId: 'MIN-LEAD-2026-0160',
      dealId: 'DEAL-2026-0030',
      quoteId: 'QT-2026-0095',
    },
    financials: {
      contractValue: 425000,
      gst: 76500,
      totalContractValue: 501500,
      receivedAmount: 127500,
      pendingAmount: 297500,
      actualCost: 105000,
      expectedProfit: 320000,
      currentProfit: 22500,
      vendorPayable: 80000,
      writtenOff: 0,
      loss: 0,
    },
    health: {
      schedule: 95,
      budget: 90,
      execution: 42,
      procurement: 40,
      payment: 30,
      overall: 'ON TRACK',
    },
    alerts: [
      '✓ BOQ approved by customer',
    ],
  },
];

export const mockTasks: Task[] = [
  { id: 'TSK-001', projectId: 'PRJ-2026-0048', title: 'False Ceiling Framework', assignedTo: 'Rahul S A', priority: 'High', startDate: '2026-09-25', dueDate: '2026-09-30', progress: 90, status: 'In Progress' },
  { id: 'TSK-002', projectId: 'PRJ-2026-0048', title: 'Lighting Automation Installation', assignedTo: 'Mukesh V', priority: 'High', startDate: '2026-09-28', dueDate: '2026-10-03', progress: 40, status: 'In Progress' },
  { id: 'TSK-003', projectId: 'PRJ-2026-0048', title: 'Final Testing', assignedTo: 'Dinesh Subramanian', priority: 'Medium', startDate: '2026-10-04', dueDate: '2026-10-05', progress: 0, status: 'Not Started' },
];

export const mockBOQ: BOQItem[] = [
  { id: 'BOQ-001', projectId: 'PRJ-2026-0048', category: 'FALSE CEILING', item: 'Gypsum Ceiling', quantity: 1200, unit: 'Sq.ft', quotedAmount: 120000, actualCost: 98000, variance: 22000, status: 'Completed', vendorCost: 85000, paid: 85000 },
  { id: 'BOQ-002', projectId: 'PRJ-2026-0048', category: 'ELECTRICAL', item: 'Smart Switches', quantity: 24, unit: 'Nos', quotedAmount: 72000, actualCost: 61000, variance: 11000, status: 'In Progress', vendorCost: 55000, paid: 30000 },
  { id: 'BOQ-003', projectId: 'PRJ-2026-0048', category: 'AUTOMATION', item: 'Curtain Automation', quantity: 8, unit: 'Nos', quotedAmount: 96000, actualCost: 74000, variance: 22000, status: 'Pending', vendorCost: 65000, paid: 0 },
];

export const mockProcurement: ProcurementItem[] = [
  { id: 'PROC-001', projectId: 'PRJ-2026-0048', material: 'Smart Touch Panel', boqCategory: 'AUTOMATION', vendor: 'Vendor A', requiredQty: 24, orderedQty: 24, receivedQty: 18, pendingQty: 6, requiredDate: '2026-10-02', purchaseStatus: 'Partially Received', paymentStatus: 'Paid' },
  { id: 'PROC-002', projectId: 'PRJ-2026-0048', material: 'Curtain Motors', boqCategory: 'AUTOMATION', vendor: 'Vendor B', requiredQty: 8, orderedQty: 8, receivedQty: 0, pendingQty: 8, requiredDate: '2026-10-05', purchaseStatus: 'Ordered', paymentStatus: 'Partially Paid' },
];

export const mockSiteVisits: SiteVisit[] = [
  { id: 'SV-001', projectId: 'PRJ-2026-0048', date: '2026-09-29', purpose: 'Measurement Verification', assignedTo: 'Dinesh Subramanian', status: 'Completed', notes: 'All measurements verified and sent for production.' },
  { id: 'SV-002', projectId: 'PRJ-2026-0048', date: '2026-10-01', purpose: 'Installation Inspection', assignedTo: 'Rahul S A', status: 'Scheduled' },
];

export const mockTeam: TeamMember[] = [
  { id: 'TM-001', projectId: 'PRJ-2026-0048', role: 'Project Manager', name: 'Dinesh Subramanian', taskCount: 5, responsibility: 'Overall Delivery' },
  { id: 'TM-002', projectId: 'PRJ-2026-0048', role: 'Project Coordinator', name: 'Rahul S A', taskCount: 12, responsibility: 'Execution & Updates' },
  { id: 'TM-003', projectId: 'PRJ-2026-0048', role: 'Site Executive', name: 'Mukesh V', taskCount: 8, responsibility: 'On-site monitoring' },
  { id: 'TM-004', projectId: 'PRJ-2026-0048', role: 'Architect', name: 'Abishek Subramanian', taskCount: 2, responsibility: 'Design & Approvals' },
  { id: 'TM-005', projectId: 'PRJ-2026-0048', role: 'Procurement', name: 'Vignesh', taskCount: 15, responsibility: 'Materials & Vendors' },
];

export const mockDocuments: Document[] = [
  { id: 'DOC-001', projectId: 'PRJ-2026-0048', name: 'Final BOQ.pdf', type: 'BOQ', uploadedDate: '2026-09-28', uploadedBy: 'Dinesh Subramanian' },
  { id: 'DOC-002', projectId: 'PRJ-2026-0048', name: 'Site Measurement.pdf', type: 'Measurements', uploadedDate: '2026-09-27', uploadedBy: 'Mukesh V' },
  { id: 'DOC-003', projectId: 'PRJ-2026-0048', name: 'Customer Approval.pdf', type: 'Approvals', uploadedDate: '2026-09-28', uploadedBy: 'Rahul S A' },
];

export const mockPayments: Payment[] = [
  { id: 'PAY-2026-018', projectId: 'PRJ-2026-0048', date: '2026-09-28', amount: 495600, method: 'Bank Transfer', reference: 'TXN849302', status: 'Received' },
  { id: 'PAY-2026-005', projectId: 'PRJ-2026-0048', date: '2026-08-20', amount: 50400, method: 'UPI', reference: 'UPI123456', status: 'Received' },
];

export const mockExpenses: Expense[] = [
  { id: 'EXP-001', projectId: 'PRJ-2026-0048', date: '2026-09-28', item: 'Smart Switches', category: 'Automation', vendor: 'Vendor A', amount: 61000, paymentStatus: 'Paid', status: 'Approved', description: 'Purchase of smart switches for living room', submittedBy: 'Vignesh', pprId: 'PPR-2026-0048', boqItem: 'Smart Switches', remarks: 'Material Purchase' },
];

export const mockIssues: Issue[] = [
  { id: 'ISS-001', projectId: 'PRJ-2026-0048', title: 'Material Delay', category: 'Procurement', priority: 'High', severity: 'High', description: 'Vendor A delayed shipment by 2 days.', reportedBy: 'Vignesh', assignedTo: 'Vignesh', createdDate: '2026-09-28', dateReported: '2026-09-28', dueDate: '2026-10-01', status: 'Open' },
  { id: 'ISS-002', projectId: 'PRJ-2026-0048', title: 'Customer Design Change', category: 'Design', priority: 'Medium', severity: 'Medium', description: 'Customer wants to change lighting setup.', reportedBy: 'Priya', assignedTo: 'Abishek Subramanian', createdDate: '2026-09-27', dateReported: '2026-09-27', dueDate: '2026-09-30', status: 'In Progress' },
  { id: 'ISS-003', projectId: 'PRJ-2026-0048', title: 'Site Measurement Issue', category: 'Execution', priority: 'High', severity: 'High', description: 'Mismatch in false ceiling measurements.', reportedBy: 'Mukesh V', assignedTo: 'Rahul S A', createdDate: '2026-09-29', dateReported: '2026-09-29', dueDate: '2026-09-29', status: 'Resolved' },
];

export const mockTimeline: TimelineEvent[] = [
  { id: 'TL-001', projectId: 'PRJ-2026-0048', date: '2026-09-29', time: '10:30 AM', user: 'Dinesh Subramanian', action: 'Site measurement verified', description: 'Verified all site dimensions.' },
  { id: 'TL-002', projectId: 'PRJ-2026-0048', date: '2026-09-28', time: '04:15 PM', user: 'Vignesh', action: 'Materials ordered from Vendor A', description: 'Raised PO for Smart Switches.' },
  { id: 'TL-003', projectId: 'PRJ-2026-0048', date: '2026-09-27', time: '11:00 AM', user: 'Customer', action: 'Customer approved final BOQ', description: 'Signed BOQ received.' },
  { id: 'TL-004', projectId: 'PRJ-2026-0048', date: '2026-09-25', time: '09:00 AM', user: 'Rahul S A', action: 'Project execution started', description: 'Team mobilized on site.' },
  { id: 'TL-005', projectId: 'PRJ-2026-0048', date: '2026-08-15', time: '05:30 PM', user: 'System', action: 'Project created from Deal Won', description: 'Project handed over from Sales.' },
];
