// ============================================================
// CRM — Mock Data Layer (Replace with API calls when backend is ready)
// ============================================================

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Requirements Collected'
  | 'Preliminary Quote Sent'
  | 'Follow-up'
  | 'Site Visit Scheduled'
  | 'Site Visit Completed'
  | 'Final Quote Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'On Hold';

export type CustomerType =
  | 'Individual'
  | 'Company'
  | 'Builder'
  | 'Architect'
  | 'Interior Designer'
  | 'Contractor';

export type PropertyType =
  | 'Villa'
  | 'Apartment'
  | 'Independent House'
  | 'Office'
  | 'Restaurant'
  | 'Commercial'
  | 'Builder Project';

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Walk-in'
  | 'Social Media'
  | 'Exhibition'
  | 'Cold Call'
  | 'Google Ads';

export type DealStage = 'Negotiation' | 'Deal Won' | 'Deal Lost';
export type SiteVisitStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Rescheduled' | 'Cancelled';
export type QuoteStatus = 'Not Sent' | 'Sent' | 'Accepted' | 'Rejected';

// ── Interfaces ────────────────────────────────────────────

export interface CRMLead {
  id: string;           // MIN-LEAD-2026-XXXX
  customerName: string;
  customerType: CustomerType;
  phone: string;
  email: string;
  whatsapp?: string;
  propertyType: PropertyType;
  siteLocation: string;
  requirement: string;
  services: string[];
  budgetRange: string;
  salesExecutive: string;
  surveyAssignedTo?: string;
  stage: LeadStage;
  nextAction: string;
  lastContact: string;
  status: 'Active' | 'Inactive' | 'Won' | 'Lost';
  source: LeadSource;
  createdDate: string;
  prelimQuoteAmount?: number;
  prelimQuoteDate?: string;
  prelimQuoteStatus: QuoteStatus;
  finalQuoteId?: string;
  dealId?: string;
  notes?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  type: 'created' | 'call' | 'whatsapp' | 'email' | 'followup' | 'quote' | 'site_visit' | 'note' | 'stage_change' | 'deal' | 'assignment';
  title: string;
  description?: string;
  amount?: number;
  by: string;
}

export interface CRMFollowUp {
  id: string;
  leadId: string;
  customerName: string;
  salesExecutive: string;
  lastContact: string;
  nextFollowup: string;
  nextFollowupTime: string;
  purpose: string;
  stage: LeadStage;
  status: 'Due Today' | 'Overdue' | 'Upcoming' | 'Completed';
  phone: string;
  whatsapp: string;
}

export interface CRMSiteVisit {
  id: string;           // SV-2026-XXXX
  leadId: string;
  customerName: string;
  siteLocation: string;
  date: string;
  time: string;
  assignedTo: string;
  status: SiteVisitStatus;
  notes?: string;
}

export interface QuoteLineItem {
  category: string;
  description: string;
  amount: number;
}

export interface CRMQuote {
  id: string;           // QT-2026-XXXX
  leadId: string;
  customerName: string;
  type: 'Preliminary' | 'Final';
  status: QuoteStatus;
  date: string;
  lineItems: QuoteLineItem[];
  total: number;
  createdBy: string;
}

export interface CRMDeal {
  id: string;           // DEAL-2026-XXXX
  leadId: string;
  quoteId?: string;
  customerName: string;
  dealName: string;
  value: number;
  salesExecutive: string;
  stage: DealStage;
  expectedClose: string;
  status: 'Active' | 'Won' | 'Lost';
  services: string[];
  projectCreated?: boolean;
}

// ── Pipeline Data ─────────────────────────────────────────

export const pipelineStages = [
  { key: 'Leads', label: 'LEADS', count: 15, value: '₹28.5L' },
  { key: 'Requirements', label: 'REQUIREMENTS', count: 9, value: '₹19.2L' },
  { key: 'Preliminary Quote', label: 'PRELIM QUOTE', count: 12, value: '₹31.4L' },
  { key: 'Follow-up', label: 'FOLLOW-UP', count: 18, value: '₹42.8L' },
  { key: 'Site Visit', label: 'SITE VISIT', count: 7, value: '₹17.5L' },
  { key: 'Final Quote', label: 'FINAL QUOTE', count: 11, value: '₹36.2L' },
  { key: 'Negotiation', label: 'NEGOTIATION', count: 8, value: '₹29.8L' },
  { key: 'Deal Won', label: 'DEAL WON', count: 6, value: '₹18.4L' },
  { key: 'Project', label: 'PROJECT', count: 4, value: '₹14.2L' },
];

// ── Mock Leads ────────────────────────────────────────────

export const mockLeads: CRMLead[] = [
  {
    id: 'MIN-LEAD-2026-0148',
    customerName: 'Rajesh Kumar',
    customerType: 'Individual',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@email.com',
    whatsapp: '+91 98765 43210',
    propertyType: 'Villa',
    siteLocation: 'Anna Nagar, Chennai',
    requirement: 'Complete smart home automation including lighting, curtains, AC, and security integration.',
    services: ['Home Automation', 'Security'],
    budgetRange: '₹4–6L',
    salesExecutive: 'Dinesh',
    surveyAssignedTo: 'Rahul',
    stage: 'Follow-up',
    nextAction: 'Call Customer',
    lastContact: '27 Sep 2026',
    status: 'Active',
    source: 'Referral',
    createdDate: '25 Sep 2026',
    prelimQuoteAmount: 485000,
    prelimQuoteDate: '28 Sep 2026',
    prelimQuoteStatus: 'Sent',
    notes: 'Customer is interested. Final decision pending spouse discussion.',
    timeline: [
      { id: 't1', date: '29 Sep 2026', time: '10:30 AM', type: 'followup', title: 'Follow-up scheduled', description: 'Call to discuss preliminary quote acceptance.', by: 'Dinesh' },
      { id: 't2', date: '28 Sep 2026', time: '03:45 PM', type: 'quote', title: 'Preliminary quote sent', description: 'Preliminary quote of ₹4,85,000 sent via email.', amount: 485000, by: 'Dinesh' },
      { id: 't3', date: '27 Sep 2026', time: '11:00 AM', type: 'call', title: 'Call completed', description: 'Discussed requirements in detail. Customer needs automation for 3 BHK.', by: 'Dinesh' },
      { id: 't4', date: '25 Sep 2026', time: '09:15 AM', type: 'created', title: 'Lead created', description: 'Lead created from referral — Suresh Babu.', by: 'Dinesh' },
    ],
  },
  {
    id: 'MIN-LEAD-2026-0149',
    customerName: 'Priya Homes Pvt. Ltd.',
    customerType: 'Company',
    phone: '+91 91234 56789',
    email: 'contact@priyahomes.com',
    propertyType: 'Builder Project',
    siteLocation: 'OMR, Chennai',
    requirement: 'Interior design and automation for 24-unit residential complex.',
    services: ['Interior Design', 'Home Automation'],
    budgetRange: '₹8–10L',
    salesExecutive: 'Jaya',
    stage: 'Negotiation',
    nextAction: 'Final Quote',
    lastContact: '28 Sep 2026',
    status: 'Active',
    source: 'Website',
    createdDate: '20 Sep 2026',
    prelimQuoteAmount: 840000,
    prelimQuoteDate: '25 Sep 2026',
    prelimQuoteStatus: 'Accepted',
    notes: 'Large deal. Director-level negotiation required.',
    timeline: [
      { id: 't5', date: '28 Sep 2026', time: '04:00 PM', type: 'stage_change', title: 'Moved to Negotiation', description: 'Customer accepted preliminary quote. Entered negotiation phase.', by: 'Jaya' },
      { id: 't6', date: '25 Sep 2026', time: '02:00 PM', type: 'quote', title: 'Preliminary quote sent', amount: 840000, by: 'Jaya' },
      { id: 't7', date: '22 Sep 2026', time: '11:30 AM', type: 'site_visit', title: 'Site visit completed', description: 'Full site survey done. Measurements recorded.', by: 'Rahul' },
      { id: 't8', date: '20 Sep 2026', time: '10:00 AM', type: 'created', title: 'Lead created', description: 'Inbound lead from website contact form.', by: 'Jaya' },
    ],
  },
  {
    id: 'MIN-LEAD-2026-0150',
    customerName: 'Suresh Babu',
    customerType: 'Individual',
    phone: '+91 94567 89012',
    email: 'suresh.babu@gmail.com',
    propertyType: 'Independent House',
    siteLocation: 'Velachery, Chennai',
    requirement: 'Full landscaping with drip irrigation and garden automation.',
    services: ['Landscaping', 'Garden Automation'],
    budgetRange: '₹2–3L',
    salesExecutive: 'Priya',
    stage: 'New',
    nextAction: 'Call Customer',
    lastContact: '29 Sep 2026',
    status: 'Active',
    source: 'Cold Call',
    createdDate: '29 Sep 2026',
    prelimQuoteStatus: 'Not Sent',
    timeline: [
      { id: 't9', date: '29 Sep 2026', time: '09:00 AM', type: 'created', title: 'Lead created', by: 'Priya' },
    ],
  },
  {
    id: 'MIN-LEAD-2026-0151',
    customerName: 'Anita Sharma',
    customerType: 'Individual',
    phone: '+91 99887 76655',
    email: 'anita.sharma@outlook.com',
    propertyType: 'Apartment',
    siteLocation: 'Adyar, Chennai',
    requirement: 'Smart home + false ceiling interior design.',
    services: ['Home Automation', 'Interior Design'],
    budgetRange: '₹6–8L',
    salesExecutive: 'Dinesh',
    stage: 'Site Visit Scheduled',
    nextAction: 'Site Visit',
    lastContact: '28 Sep 2026',
    status: 'Active',
    source: 'Google Ads',
    createdDate: '26 Sep 2026',
    prelimQuoteStatus: 'Not Sent',
    timeline: [
      { id: 't10', date: '28 Sep 2026', time: '03:00 PM', type: 'site_visit', title: 'Site visit scheduled', description: 'Scheduled for 01 Oct 2026 at 11:00 AM.', by: 'Dinesh' },
      { id: 't11', date: '27 Sep 2026', time: '01:30 PM', type: 'call', title: 'Call completed', description: 'Discussed requirements. Customer confirmed apartment is 1800 sqft.', by: 'Dinesh' },
      { id: 't12', date: '26 Sep 2026', time: '10:00 AM', type: 'created', title: 'Lead created', by: 'Dinesh' },
    ],
  },
  {
    id: 'MIN-LEAD-2026-0152',
    customerName: 'Kavitha Rajan',
    customerType: 'Individual',
    phone: '+91 87654 32109',
    email: 'kavitha.rajan@gmail.com',
    propertyType: 'Villa',
    siteLocation: 'Perungudi, Chennai',
    requirement: 'Complete home automation — KNX-based system.',
    services: ['Home Automation'],
    budgetRange: '₹1.5–2.5L',
    salesExecutive: 'Dinesh',
    stage: 'On Hold',
    nextAction: 'Await Customer Response',
    lastContact: '20 Sep 2026',
    status: 'Active',
    source: 'Referral',
    createdDate: '18 Sep 2026',
    prelimQuoteStatus: 'Sent',
    timeline: [
      { id: 't13', date: '20 Sep 2026', time: '04:00 PM', type: 'followup', title: 'Follow-up attempted', description: 'Customer unavailable. Moved to On Hold.', by: 'Dinesh' },
      { id: 't14', date: '19 Sep 2026', time: '11:00 AM', type: 'quote', title: 'Preliminary quote sent', amount: 195000, by: 'Dinesh' },
      { id: 't15', date: '18 Sep 2026', time: '09:30 AM', type: 'created', title: 'Lead created', by: 'Dinesh' },
    ],
  },
  {
    id: 'MIN-LEAD-2026-0153',
    customerName: 'Techpark Developers',
    customerType: 'Builder',
    phone: '+91 44 2345 6789',
    email: 'projects@techparkdev.com',
    propertyType: 'Commercial',
    siteLocation: 'Guindy, Chennai',
    requirement: 'Office automation for 5-floor commercial building.',
    services: ['Home Automation', 'Security'],
    budgetRange: '₹12–18L',
    salesExecutive: 'Jaya',
    stage: 'Won',
    nextAction: 'Convert to Project',
    lastContact: '15 Sep 2026',
    status: 'Won',
    source: 'Exhibition',
    createdDate: '01 Sep 2026',
    prelimQuoteStatus: 'Accepted',
    dealId: 'DEAL-2026-0024',
    timeline: [
      { id: 't16', date: '15 Sep 2026', time: '05:00 PM', type: 'deal', title: 'Deal Won!', description: 'Contract signed. Advance payment received.', amount: 1420000, by: 'Jaya' },
    ],
  },
];

// ── Mock Follow-ups ───────────────────────────────────────

export const mockFollowUps: CRMFollowUp[] = [
  {
    id: 'FU-2026-0081',
    leadId: 'MIN-LEAD-2026-0148',
    customerName: 'Rajesh Kumar',
    salesExecutive: 'Dinesh',
    lastContact: '27 Sep 2026',
    nextFollowup: '29 Sep 2026',
    nextFollowupTime: '11:30 AM',
    purpose: 'Discuss preliminary quote acceptance and next steps',
    stage: 'Follow-up',
    status: 'Due Today',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
  },
  {
    id: 'FU-2026-0082',
    leadId: 'MIN-LEAD-2026-0149',
    customerName: 'Priya Homes Pvt. Ltd.',
    salesExecutive: 'Jaya',
    lastContact: '28 Sep 2026',
    nextFollowup: '29 Sep 2026',
    nextFollowupTime: '03:30 PM',
    purpose: 'Negotiate final price for 24-unit project',
    stage: 'Negotiation',
    status: 'Due Today',
    phone: '+91 91234 56789',
    whatsapp: '+91 91234 56789',
  },
  {
    id: 'FU-2026-0083',
    leadId: 'MIN-LEAD-2026-0152',
    customerName: 'Kavitha Rajan',
    salesExecutive: 'Dinesh',
    lastContact: '20 Sep 2026',
    nextFollowup: '26 Sep 2026',
    nextFollowupTime: '04:00 PM',
    purpose: 'Check if customer is ready to proceed',
    stage: 'On Hold',
    status: 'Overdue',
    phone: '+91 87654 32109',
    whatsapp: '+91 87654 32109',
  },
  {
    id: 'FU-2026-0084',
    leadId: 'MIN-LEAD-2026-0150',
    customerName: 'Suresh Babu',
    salesExecutive: 'Priya',
    lastContact: '29 Sep 2026',
    nextFollowup: '01 Oct 2026',
    nextFollowupTime: '10:00 AM',
    purpose: 'Send preliminary landscaping quote',
    stage: 'New',
    status: 'Upcoming',
    phone: '+91 94567 89012',
    whatsapp: '+91 94567 89012',
  },
];

// ── Mock Site Visits ──────────────────────────────────────

export const mockSiteVisits: CRMSiteVisit[] = [
  {
    id: 'SV-2026-0038',
    leadId: 'MIN-LEAD-2026-0148',
    customerName: 'Rajesh Kumar',
    siteLocation: 'Anna Nagar, Chennai',
    date: '01 Oct 2026',
    time: '10:00 AM',
    assignedTo: 'Rahul',
    status: 'Scheduled',
    notes: 'Measure false ceiling area and confirm automation panel location.',
  },
  {
    id: 'SV-2026-0039',
    leadId: 'MIN-LEAD-2026-0151',
    customerName: 'Anita Sharma',
    siteLocation: 'Adyar, Chennai',
    date: '01 Oct 2026',
    time: '11:00 AM',
    assignedTo: 'Dinesh',
    status: 'Confirmed',
  },
  {
    id: 'SV-2026-0037',
    leadId: 'MIN-LEAD-2026-0149',
    customerName: 'Priya Homes Pvt. Ltd.',
    siteLocation: 'OMR, Chennai',
    date: '22 Sep 2026',
    time: '10:00 AM',
    assignedTo: 'Rahul',
    status: 'Completed',
    notes: 'Full site survey done for 24-unit complex.',
  },
];

// ── Mock Quotes ───────────────────────────────────────────

export const mockQuotes: CRMQuote[] = [
  {
    id: 'QT-2026-0082',
    leadId: 'MIN-LEAD-2026-0148',
    customerName: 'Rajesh Kumar',
    type: 'Preliminary',
    status: 'Sent',
    date: '28 Sep 2026',
    lineItems: [
      { category: 'Home Automation', description: 'Smart Lighting + Curtains + AC Control', amount: 285000 },
      { category: 'Security', description: 'CCTV + Video Doorbell + Smart Lock', amount: 120000 },
      { category: 'Installation', description: 'Wiring, Panel & Setup', amount: 80000 },
    ],
    total: 485000,
    createdBy: 'Dinesh',
  },
  {
    id: 'QT-2026-0084',
    leadId: 'MIN-LEAD-2026-0149',
    customerName: 'Priya Homes Pvt. Ltd.',
    type: 'Final',
    status: 'Accepted',
    date: '25 Sep 2026',
    lineItems: [
      { category: 'False Ceiling', description: 'POP false ceiling for all units', amount: 210000 },
      { category: 'Electrical', description: 'Electrical works across 24 units', amount: 145000 },
      { category: 'Home Automation', description: 'Smart lighting, fans, AC control', amount: 285000 },
      { category: 'Interior Works', description: 'Modular kitchen + wardrobes', amount: 120000 },
      { category: 'Others', description: 'Accessories & miscellaneous', amount: 80000 },
    ],
    total: 840000,
    createdBy: 'Jaya',
  },
];

// ── Mock Deals ────────────────────────────────────────────

export const mockDeals: CRMDeal[] = [
  {
    id: 'DEAL-2026-0024',
    leadId: 'MIN-LEAD-2026-0153',
    quoteId: 'QT-2026-0084',
    customerName: 'Techpark Developers',
    dealName: 'Techpark Office Automation',
    value: 1420000,
    salesExecutive: 'Jaya',
    stage: 'Deal Won',
    expectedClose: '01 Oct 2026',
    status: 'Won',
    services: ['Home Automation', 'Security'],
    projectCreated: true,
  },
  {
    id: 'DEAL-2026-0025',
    leadId: 'MIN-LEAD-2026-0149',
    quoteId: 'QT-2026-0084',
    customerName: 'Priya Homes Pvt. Ltd.',
    dealName: 'OMR Residential Complex',
    value: 840000,
    salesExecutive: 'Jaya',
    stage: 'Negotiation',
    expectedClose: '15 Oct 2026',
    status: 'Active',
    services: ['Interior Design', 'Home Automation'],
    projectCreated: false,
  },
];

// ── Summary Stats ─────────────────────────────────────────

export const crmSummary = {
  totalLeads: { count: 128, monthDelta: 18 },
  newLeads: { count: 15, label: 'Today' },
  followUps: { count: 32, dueToday: 12 },
  siteVisits: { count: 8, upcoming: 3 },
  activeDeals: { count: 21, pipeline: '₹48.6L' },
  wonThisMonth: { count: 6, value: '₹18.4L' },
};

// ── Workflow Steps ────────────────────────────────────────

export const workflowSteps = [
  'Lead',
  'Requirements',
  'Preliminary Quote',
  'Follow-up',
  'Site Visit',
  'Final Quote',
  'Negotiation',
  'Deal Won',
  'Project',
];

export const stageToWorkflowIndex: Record<string, number> = {
  'New': 0,
  'Contacted': 0,
  'Requirements Collected': 1,
  'Preliminary Quote Sent': 2,
  'Follow-up': 3,
  'Site Visit Scheduled': 4,
  'Site Visit Completed': 4,
  'Final Quote Sent': 5,
  'Negotiation': 6,
  'Won': 7,
  'Lost': 7,
  'On Hold': 3,
};
