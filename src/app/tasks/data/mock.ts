export type TaskStatus = 'Not Started' | 'Assigned' | 'Accepted' | 'In Progress' | 'Blocked' | 'On Hold' | 'Completed' | 'Verified' | 'Closed' | 'Cancelled';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskType = 'Project Task' | 'CRM Task' | 'Follow-up' | 'Site Visit' | 'Procurement' | 'BOQ' | 'PPR / Finance' | 'Customer Request' | 'Internal Task' | 'Meeting' | 'Inspection' | 'Maintenance' | 'Learning' | 'HR' | 'Management' | 'Other';
export type TaskSource = 'CRM' | 'Project' | 'Parks' | 'Finance' | 'HR' | 'Learning' | 'Manual' | 'System Generated';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface TaskActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  url: string;
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  description: string;
  source: TaskSource;
  
  // References
  projectId?: string;
  projectName?: string;
  customerId?: string;
  customerName?: string;
  leadId?: string;
  dealId?: string;
  taskListId?: string;
  parentTaskId?: string;
  
  // Assignments
  assignedTo: string;
  assignedBy: string;
  collaborators: string[];
  watchers: string[];
  
  // Status & Priority
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  
  // Dates
  createdDate: string;
  startDate?: string;
  dueDate: string;
  completedDate?: string;
  
  // Tracking
  estimatedHours?: number;
  actualHours?: number;
  
  // Completion & Verification
  requiresCompletionProof?: boolean;
  requiresVerification?: boolean;
  isRecurringInstance?: boolean;

  // Details
  checklist: ChecklistItem[];
  comments: TaskComment[];
  activities: TaskActivity[];
  attachments: TaskAttachment[];
  
  // Blocks
  blockedBy?: string[]; // IDs of tasks
  blocks?: string[]; // IDs of tasks
}

export const mockTasks: Task[] = [
  {
    id: 'TASK-2026-0184',
    name: 'Finalize False Ceiling BOQ',
    type: 'BOQ',
    description: 'Finalize the false ceiling BOQ based on the latest site measurements and customer-approved design.',
    source: 'Project',
    projectId: 'PRJ-2026-0048',
    projectName: 'Kumar Residence',
    customerId: 'CUST-082',
    customerName: 'Rajesh Kumar',
    dealId: 'DEAL-2026-0024',
    assignedTo: 'Dinesh',
    assignedBy: 'Rahul S A',
    collaborators: ['Mukesh'],
    watchers: ['Abishek'],
    status: 'In Progress',
    priority: 'HIGH',
    progress: 75,
    createdDate: '2026-09-27T10:00:00Z',
    startDate: '2026-09-29T09:00:00Z',
    dueDate: '2026-09-29T10:30:00Z',
    estimatedHours: 4,
    actualHours: 2.5,
    checklist: [
      { id: 'C1', title: 'Verify measurements', completed: true },
      { id: 'C2', title: 'Check material specification', completed: true },
      { id: 'C3', title: 'Confirm ceiling design', completed: true },
      { id: 'C4', title: 'Finalize quantity', completed: false },
      { id: 'C5', title: 'Calculate BOQ amount', completed: false },
      { id: 'C6', title: 'Upload BOQ', completed: false },
      { id: 'C7', title: 'Send for approval', completed: false },
    ],
    comments: [
      { id: 'CM1', userId: 'U2', userName: 'Rahul', text: 'Measurements updated yesterday.', timestamp: '2026-09-28T17:30:00Z' },
      { id: 'CM2', userId: 'U1', userName: 'Dinesh', text: 'I will finalize the BOQ today.', timestamp: '2026-09-29T08:00:00Z' }
    ],
    activities: [
      { id: 'A1', userId: 'U2', userName: 'Rahul', action: 'Task created', timestamp: '2026-09-27T16:20:00Z' },
      { id: 'A2', userId: 'U1', userName: 'Dinesh', action: 'completed "Confirm ceiling design"', timestamp: '2026-09-29T09:40:00Z' },
      { id: 'A3', userId: 'U1', userName: 'Dinesh', action: 'changed progress to 75%', timestamp: '2026-09-29T10:20:00Z' }
    ],
    attachments: [
      { id: 'ATT1', fileName: 'Site Measurement.pdf', fileSize: '1.2 MB', fileType: 'application/pdf', url: '#' },
      { id: 'ATT2', fileName: 'Previous BOQ.xlsx', fileSize: '450 KB', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#' }
    ]
  },
  {
    id: 'TASK-2026-0185',
    name: 'Customer Quote Follow-up',
    type: 'Follow-up',
    description: 'Call customer to discuss the recent quote sent.',
    source: 'CRM',
    customerId: 'CUST-082',
    customerName: 'Rajesh Kumar',
    leadId: 'LEAD-2026-0150',
    assignedTo: 'Dinesh',
    assignedBy: 'Jaya',
    collaborators: [],
    watchers: [],
    status: 'Not Started',
    priority: 'MEDIUM',
    progress: 0,
    createdDate: '2026-09-28T14:00:00Z',
    dueDate: '2026-09-29T11:30:00Z',
    checklist: [],
    comments: [],
    activities: [],
    attachments: []
  },
  {
    id: 'TASK-2026-0186',
    name: 'Verify Site Measurement',
    type: 'Site Visit',
    description: 'Visit site and verify measurements before starting false ceiling framework.',
    source: 'Project',
    projectId: 'PRJ-2026-0050',
    projectName: 'Anna Nagar Villa',
    assignedTo: 'Dinesh',
    assignedBy: 'Rahul S A',
    collaborators: ['Mukesh'],
    watchers: [],
    status: 'Not Started',
    priority: 'HIGH',
    progress: 0,
    createdDate: '2026-09-28T16:00:00Z',
    dueDate: '2026-09-29T14:00:00Z',
    checklist: [],
    comments: [],
    activities: [],
    attachments: []
  },
  {
    id: 'TASK-2026-0187',
    name: 'Automation Installation',
    type: 'Project Task',
    description: 'Install smart switches and controllers.',
    source: 'Project',
    projectId: 'PRJ-2026-0048',
    projectName: 'Kumar Residence',
    assignedTo: 'Mukesh',
    assignedBy: 'Dinesh',
    collaborators: [],
    watchers: [],
    status: 'Blocked',
    priority: 'CRITICAL',
    progress: 10,
    createdDate: '2026-09-20T10:00:00Z',
    dueDate: '2026-09-28T17:00:00Z',
    blockedBy: ['TASK-2026-0170'],
    checklist: [],
    comments: [],
    activities: [],
    attachments: []
  }
];
