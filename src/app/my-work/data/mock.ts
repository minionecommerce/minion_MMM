// ============================================================
// MY WORK — Mock Data Layer
// Replace these with actual API calls when backend is ready.
// ============================================================

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type FollowUpStage = 'New Lead' | 'Quote Sent' | 'Negotiation' | 'Won' | 'Lost';

// ---- Tasks ----
export interface WorkTask {
  id: string;
  title: string;
  type: 'project' | 'followup' | 'site' | 'admin' | 'approval';
  project?: string;
  customer?: string;
  assignedTo: string;
  dueTime: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  description?: string;
  checklist?: { label: string; done: boolean }[];
  attachments?: { name: string; size: string }[];
  comments?: { author: string; avatar: string; text: string; time: string }[];
}

export const mockTasks: WorkTask[] = [
  {
    id: 't1',
    title: 'Finalize False Ceiling BOQ',
    type: 'project',
    project: 'Kumar Residence',
    customer: 'Rajesh Kumar',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '10:30 AM',
    dueDate: '29 Sep 2026',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Finalize the false ceiling BOQ based on the latest site measurements and approved drawings.',
    checklist: [
      { label: 'Verify measurements', done: true },
      { label: 'Check material specification', done: true },
      { label: 'Finalize quantity', done: false },
      { label: 'Upload BOQ document', done: false },
      { label: 'Send for approval', done: false },
    ],
    attachments: [
      { name: 'Site Measurement.pdf', size: '1.2 MB' },
      { name: 'Previous BOQ.xlsx', size: '845 KB' },
    ],
    comments: [
      { author: 'Rahul', avatar: 'R', text: 'Measurements updated yesterday after site visit.', time: '2 hours ago' },
    ],
  },
  {
    id: 't2',
    title: 'Call customer for quote follow-up',
    type: 'followup',
    customer: 'Rajesh Kumar',
    project: 'Smart Home Automation',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '12:00 PM',
    dueDate: '29 Sep 2026',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Follow up with Rajesh Kumar regarding the automation package quote sent on 27 Sep.',
    checklist: [
      { label: 'Review quote before call', done: false },
      { label: 'Call customer', done: false },
      { label: 'Update CRM stage', done: false },
    ],
    comments: [],
  },
  {
    id: 't3',
    title: 'Verify site measurement',
    type: 'site',
    project: 'Anna Nagar Villa',
    customer: 'Priya Homes',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '02:00 PM',
    dueDate: '29 Sep 2026',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Re-verify site measurements for the master bedroom and living room before finalizing the interior plan.',
    checklist: [
      { label: 'Carry measuring tape & laser device', done: false },
      { label: 'Measure all rooms', done: false },
      { label: 'Photograph key areas', done: false },
      { label: 'Upload to project', done: false },
    ],
    comments: [],
  },
  {
    id: 't4',
    title: 'Upload project photos',
    type: 'project',
    project: 'Green Villa',
    customer: 'Green Villa Developers',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '04:00 PM',
    dueDate: '29 Sep 2026',
    priority: 'LOW',
    status: 'PENDING',
    description: "Upload progress photos from this morning's site visit to the project gallery.",
    checklist: [
      { label: 'Select best photos', done: false },
      { label: 'Rename files correctly', done: false },
      { label: 'Upload to project portal', done: false },
    ],
    comments: [],
  },
  {
    id: 't5',
    title: 'Prepare weekly progress report',
    type: 'admin',
    project: 'Kumar Residence',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '06:00 PM',
    dueDate: '29 Sep 2026',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Compile the weekly progress report for all active projects and share with the director.',
    checklist: [
      { label: 'Gather data from all projects', done: false },
      { label: 'Fill report template', done: false },
      { label: 'Share via email', done: false },
    ],
    comments: [],
  },
  {
    id: 't6',
    title: 'Review and approve PPR',
    type: 'approval',
    project: 'Green Villa',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '11:00 AM',
    dueDate: '29 Sep 2026',
    priority: 'HIGH',
    status: 'OVERDUE',
    description: 'Purchase and payment request from the site team for irrigation materials. Needs approval today.',
    checklist: [
      { label: 'Review quantities', done: false },
      { label: 'Verify vendor quote', done: false },
      { label: 'Approve or reject', done: false },
    ],
    comments: [],
  },
  {
    id: 't7',
    title: 'Submit attendance for team',
    type: 'admin',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '09:00 AM',
    dueDate: '29 Sep 2026',
    priority: 'LOW',
    status: 'COMPLETED',
    description: 'Mark attendance for the morning meeting attendees.',
    checklist: [
      { label: 'Open attendance sheet', done: true },
      { label: 'Mark all present', done: true },
      { label: 'Submit', done: true },
    ],
    comments: [],
  },
  {
    id: 't8',
    title: 'Coordinate with vendor for tile samples',
    type: 'project',
    project: 'Anna Nagar Villa',
    customer: 'Priya Homes',
    assignedTo: 'Dinesh Subramanian',
    dueTime: '03:30 PM',
    dueDate: '29 Sep 2026',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    description: 'Coordinate with tile vendor to arrange sample collection for client approval.',
    checklist: [
      { label: 'Call vendor', done: true },
      { label: 'Confirm sample delivery date', done: true },
      { label: 'Inform client', done: true },
    ],
    comments: [],
  },
];

// ---- Projects ----
export interface WorkProject {
  id: string;
  name: string;
  subtitle: string;
  progress: number;
  nextAction: string;
  location: string;
  dueDate: string;
  status: 'on_track' | 'critical' | 'completed' | 'delayed';
  totalTasks: number;
  completedTasks: number;
  teamSize: number;
}

export const mockProjects: WorkProject[] = [
  {
    id: 'p1',
    name: 'Kumar Residence',
    subtitle: 'Interior + Automation',
    progress: 78,
    nextAction: 'BOQ Approval',
    location: 'Anna Nagar, Chennai',
    dueDate: '04 Oct 2026',
    status: 'on_track',
    totalTasks: 24,
    completedTasks: 19,
    teamSize: 5,
  },
  {
    id: 'p2',
    name: 'Green Villa',
    subtitle: 'Landscaping + Automation',
    progress: 64,
    nextAction: 'Irrigation Installation',
    location: 'Velachery, Chennai',
    dueDate: '08 Oct 2026',
    status: 'critical',
    totalTasks: 30,
    completedTasks: 19,
    teamSize: 7,
  },
  {
    id: 'p3',
    name: 'Anna Nagar Villa',
    subtitle: 'Interior Design',
    progress: 42,
    nextAction: 'Tile Selection Approval',
    location: 'Anna Nagar, Chennai',
    dueDate: '20 Oct 2026',
    status: 'on_track',
    totalTasks: 18,
    completedTasks: 8,
    teamSize: 4,
  },
  {
    id: 'p4',
    name: 'Sunrise Apartments',
    subtitle: 'Smart Home Automation',
    progress: 91,
    nextAction: 'Final Testing',
    location: 'OMR, Chennai',
    dueDate: '01 Oct 2026',
    status: 'critical',
    totalTasks: 14,
    completedTasks: 13,
    teamSize: 3,
  },
  {
    id: 'p5',
    name: 'Patel Bungalow',
    subtitle: 'Full Interior + Landscaping',
    progress: 28,
    nextAction: 'Design Approval',
    location: 'Adyar, Chennai',
    dueDate: '15 Nov 2026',
    status: 'on_track',
    totalTasks: 40,
    completedTasks: 11,
    teamSize: 6,
  },
  {
    id: 'p6',
    name: 'Techpark Office',
    subtitle: 'Commercial Automation',
    progress: 100,
    nextAction: 'Handover Complete',
    location: 'Guindy, Chennai',
    dueDate: '15 Sep 2026',
    status: 'completed',
    totalTasks: 22,
    completedTasks: 22,
    teamSize: 4,
  },
];

// ---- Follow-ups ----
export interface FollowUp {
  id: string;
  customerName: string;
  company?: string;
  projectType: string;
  lastContact: string;
  nextFollowup: string;
  nextFollowupTime: string;
  stage: FollowUpStage;
  quoteValue: string;
  phone: string;
  whatsapp: string;
  isOverdue: boolean;
  isToday: boolean;
}

export const mockFollowUps: FollowUp[] = [
  {
    id: 'f1',
    customerName: 'Rajesh Kumar',
    projectType: 'Smart Home Automation',
    lastContact: '27 Sep 2026',
    nextFollowup: 'Today',
    nextFollowupTime: '11:30 AM',
    stage: 'Quote Sent',
    quoteValue: '₹4,85,000',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    isOverdue: false,
    isToday: true,
  },
  {
    id: 'f2',
    customerName: 'Priya Homes',
    company: 'Priya Homes Pvt. Ltd.',
    projectType: 'Interior Design',
    lastContact: '25 Sep 2026',
    nextFollowup: 'Today',
    nextFollowupTime: '03:30 PM',
    stage: 'Negotiation',
    quoteValue: '₹8,40,000',
    phone: '+91 91234 56789',
    whatsapp: '+91 91234 56789',
    isOverdue: false,
    isToday: true,
  },
  {
    id: 'f3',
    customerName: 'Suresh Babu',
    projectType: 'Full Landscaping',
    lastContact: '22 Sep 2026',
    nextFollowup: '28 Sep 2026',
    nextFollowupTime: '10:00 AM',
    stage: 'New Lead',
    quoteValue: '₹2,20,000',
    phone: '+91 94567 89012',
    whatsapp: '+91 94567 89012',
    isOverdue: true,
    isToday: false,
  },
  {
    id: 'f4',
    customerName: 'Anita Sharma',
    projectType: 'Smart Home + Interior',
    lastContact: '28 Sep 2026',
    nextFollowup: '30 Sep 2026',
    nextFollowupTime: '02:00 PM',
    stage: 'Quote Sent',
    quoteValue: '₹6,75,000',
    phone: '+91 99887 76655',
    whatsapp: '+91 99887 76655',
    isOverdue: false,
    isToday: false,
  },
  {
    id: 'f5',
    customerName: 'Kavitha Rajan',
    projectType: 'Automation Only',
    lastContact: '20 Sep 2026',
    nextFollowup: '26 Sep 2026',
    nextFollowupTime: '04:00 PM',
    stage: 'Negotiation',
    quoteValue: '₹1,95,000',
    phone: '+91 87654 32109',
    whatsapp: '+91 87654 32109',
    isOverdue: true,
    isToday: false,
  },
];

// ---- Schedule ----
export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  type: 'company' | 'project' | 'break' | 'crm' | 'learning';
  status: 'completed' | 'current' | 'upcoming';
  location?: string;
}

export const mockSchedule: ScheduleEvent[] = [
  { id: 's1', time: '09:30', title: 'Morning Start Meeting', type: 'company', status: 'completed', location: 'Conference Room A' },
  { id: 's2', time: '11:00', title: 'Kumar Residence Site Review', type: 'project', status: 'completed', location: 'Anna Nagar Site' },
  { id: 's3', time: '01:00', title: 'Lunch', type: 'break', status: 'completed' },
  { id: 's4', time: '03:00', title: 'Customer Follow-up Call', type: 'crm', status: 'current', location: 'Rajesh Kumar — Phone' },
  { id: 's5', time: '05:45', title: 'Day Close Meeting', type: 'company', status: 'upcoming', location: 'Conference Room A' },
  { id: 's6', time: '06:00', title: 'Employee Learning Session', type: 'learning', location: 'Online', status: 'upcoming' },
];

// ---- Action Required ----
export interface ActionItem {
  id: string;
  type: 'purchase' | 'boq' | 'leave' | 'approval';
  title: string;
  subtitle: string;
  amount?: string;
  date?: string;
  urgency: 'high' | 'medium' | 'low';
}

export const mockActions: ActionItem[] = [
  { id: 'a1', type: 'purchase', title: 'Purchase Request', subtitle: 'Kumar Residence', amount: '₹48,500', urgency: 'high' },
  { id: 'a2', type: 'boq', title: 'BOQ Approval', subtitle: 'Green Villa', amount: '₹1,85,000', urgency: 'high' },
  { id: 'a3', type: 'leave', title: 'Leave Request', subtitle: 'Employee: Rahul', date: '29 Sep', urgency: 'medium' },
];

// ---- Recent Activity ----
export interface ActivityItem {
  id: string;
  icon: 'check' | 'refresh' | 'visit' | 'upload' | 'message';
  title: string;
  subtitle: string;
  time: string;
}

export const mockActivity: ActivityItem[] = [
  { id: 'ac1', icon: 'check', title: 'Task completed', subtitle: 'BOQ preparation completed', time: '10 minutes ago' },
  { id: 'ac2', icon: 'refresh', title: 'Follow-up updated', subtitle: 'Rajesh Kumar moved to Negotiation', time: '35 minutes ago' },
  { id: 'ac3', icon: 'visit', title: 'Site visit completed', subtitle: 'Kumar Residence', time: '1 hour ago' },
  { id: 'ac4', icon: 'upload', title: 'Document uploaded', subtitle: 'Final BOQ.pdf', time: '2 hours ago' },
  { id: 'ac5', icon: 'message', title: 'Comment added', subtitle: 'Green Villa — Irrigation plan', time: '3 hours ago' },
];

// ---- Performance ----
export interface PerformanceData {
  overall: number;
  metrics: { label: string; value: number; color: string }[];
  stats: {
    tasksCompleted: number;
    tasksAssigned: number;
    followUpsCompleted: number;
    followUpsTotal: number;
    projectsActive: number;
    projectsTotal: number;
    projectsCompleted: number;
  };
}

export const mockPerformance: PerformanceData = {
  overall: 92,
  metrics: [
    { label: 'Task Completion', value: 94, color: '#22c55e' },
    { label: 'Follow-up Discipline', value: 88, color: '#FFC400' },
    { label: 'Project Delivery', value: 91, color: '#3b82f6' },
    { label: 'Meeting Participation', value: 96, color: '#a855f7' },
  ],
  stats: {
    tasksCompleted: 86,
    tasksAssigned: 92,
    followUpsCompleted: 39,
    followUpsTotal: 43,
    projectsActive: 5,
    projectsTotal: 6,
    projectsCompleted: 1,
  },
};

// ---- Achievement ----
export interface AchievementData {
  currentValue: string;
  targetValue: string;
  progress: number;
  nextMilestone: string;
  level: string;
  badgesEarned: number;
  totalBadges: number;
}

export const mockAchievement: AchievementData = {
  currentValue: '₹18.4 Lakhs',
  targetValue: '₹22 Lakhs',
  progress: 84,
  nextMilestone: '₹22 Lakhs',
  level: 'Gold',
  badgesEarned: 7,
  totalBadges: 10,
};

// ---- Summary Cards ----
export const mockSummary = {
  todaysTasks: { total: 8, dueToday: 3, inProgress: 2, pending: 3 },
  overdue: { total: 3 },
  followUps: { total: 12, dueToday: 5, upcoming: 7 },
  projects: { total: 6, critical: 2, onTrack: 4 },
  performance: { value: 92, vsLastMonth: 8 },
};
