export type EmploymentStatus = 'Active' | 'On Leave' | 'Remote' | 'Probation' | 'Intern' | 'Notice Period' | 'Inactive' | 'Exited';
export type EmploymentType = 'Full Time' | 'Part Time' | 'Intern' | 'Contract' | 'Freelancer' | 'Consultant' | 'Probation' | 'WFH';
export type WorkloadStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED';

export interface EmployeeSkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  experienceYears: number;
}

export interface EmployeeProject {
  id: string;
  name: string;
  role: string;
  progress: number;
  taskCount: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface EmployeePerformance {
  taskCompletion: number;
  onTime: number;
  projectDelivery: number;
  customerFollowUp: number;
  learning: number;
  meetingParticipation: number;
  overall: number;
}

export interface EmployeeLearning {
  courseName: string;
  progress: number;
}

export interface EmployeeWorkload {
  openTasks: number;
  dueToday: number;
  overdue: number;
  inProgress: number;
  completed: number;
  workloadPercentage: number;
  status: WorkloadStatus;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  reportingManagerId: string | null;
  reportingManagerName: string | null;
  employmentType: EmploymentType;
  joiningDate: string;
  workLocation: string;
  status: EmploymentStatus;
  
  projects: EmployeeProject[];
  skills: EmployeeSkill[];
  performance: EmployeePerformance;
  learning: EmployeeLearning[];
  workload: EmployeeWorkload;
  
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  headName: string;
  memberCount: number;
  activeProjects: number;
  openTasks: number;
  completionRate: number;
}

// --- MOCK DATA ---

export const mockDepartments: Department[] = [
  { id: 'DEPT-01', name: 'Sales', headName: 'Sivabalan Subramanian', memberCount: 5, activeProjects: 12, openTasks: 38, completionRate: 88 },
  { id: 'DEPT-02', name: 'Project Operations', headName: 'Dinesh Subramanian', memberCount: 6, activeProjects: 8, openTasks: 42, completionRate: 91 },
  { id: 'DEPT-03', name: 'Interiors & Architecture', headName: 'Abishek Subramanian', memberCount: 3, activeProjects: 5, openTasks: 24, completionRate: 94 },
  { id: 'DEPT-04', name: 'Landscaping', headName: 'Dinesh Subramanian', memberCount: 4, activeProjects: 4, openTasks: 18, completionRate: 89 },
  { id: 'DEPT-05', name: 'Finance', headName: 'Nivashini', memberCount: 2, activeProjects: 0, openTasks: 15, completionRate: 96 },
  { id: 'DEPT-06', name: 'HR', headName: 'UitthaMugi S', memberCount: 1, activeProjects: 0, openTasks: 12, completionRate: 95 },
  { id: 'DEPT-07', name: 'Procurement', headName: 'Vignesh', memberCount: 2, activeProjects: 8, openTasks: 28, completionRate: 90 },
];

export const mockEmployees: Employee[] = [
  {
    id: 'U-001',
    employeeCode: 'EMP-0001',
    fullName: 'Sivabalan Subramanian',
    email: 'siva@minion.com',
    phone: '+91 9876543210',
    department: 'Leadership',
    designation: 'CEO, Founder & Managing Director',
    reportingManagerId: null,
    reportingManagerName: null,
    employmentType: 'Full Time',
    joiningDate: '2020-01-01',
    workLocation: 'HQ - Chennai',
    status: 'Active',
    projects: [],
    skills: [
      { name: 'Leadership', level: 'Expert', experienceYears: 10 },
      { name: 'Business Strategy', level: 'Expert', experienceYears: 10 },
    ],
    performance: { taskCompletion: 95, onTime: 95, projectDelivery: 90, customerFollowUp: 90, learning: 80, meetingParticipation: 98, overall: 94 },
    learning: [],
    workload: { openTasks: 12, dueToday: 3, overdue: 0, inProgress: 4, completed: 150, workloadPercentage: 60, status: 'NORMAL' }
  },
  {
    id: 'U-002',
    employeeCode: 'EMP-0002',
    fullName: 'Dinesh Subramanian',
    email: 'dinesh@minion.com',
    phone: '+91 9876543211',
    department: 'Project Operations',
    designation: 'CMO, Chief Project Manager',
    reportingManagerId: 'U-001',
    reportingManagerName: 'Sivabalan Subramanian',
    employmentType: 'Full Time',
    joiningDate: '2020-01-15',
    workLocation: 'HQ - Chennai',
    status: 'Active',
    projects: [
      { id: 'PRJ-2026-0048', name: 'Kumar Residence', role: 'Project Manager', progress: 78, taskCount: 18, priority: 'High' },
      { id: 'LAND-2026-0018', name: 'Green Villa', role: 'Project Manager', progress: 64, taskCount: 12, priority: 'Medium' }
    ],
    skills: [
      { name: 'Project Management', level: 'Expert', experienceYears: 8 },
      { name: 'CRM', level: 'Advanced', experienceYears: 5 },
      { name: 'Automation', level: 'Advanced', experienceYears: 6 },
    ],
    performance: { taskCompletion: 94, onTime: 91, projectDelivery: 92, customerFollowUp: 89, learning: 96, meetingParticipation: 95, overall: 93 },
    learning: [
      { courseName: 'Zoho CRM Advanced Development', progress: 78 },
      { courseName: 'Smart Home Architecture', progress: 92 }
    ],
    workload: { openTasks: 18, dueToday: 4, overdue: 1, inProgress: 6, completed: 86, workloadPercentage: 92, status: 'HIGH' }
  },
  {
    id: 'U-003',
    employeeCode: 'EMP-0003',
    fullName: 'Rahul S A',
    email: 'rahul@minion.com',
    phone: '+91 9876543212',
    department: 'Project Operations',
    designation: 'Project Coordination Executive',
    reportingManagerId: 'U-002',
    reportingManagerName: 'Dinesh Subramanian',
    employmentType: 'Full Time',
    joiningDate: '2022-03-10',
    workLocation: 'HQ - Chennai',
    status: 'Active',
    projects: [
      { id: 'PRJ-2026-0048', name: 'Kumar Residence', role: 'Project Coordinator', progress: 78, taskCount: 12, priority: 'High' },
      { id: 'PRJ-2026-0050', name: 'Anna Nagar Villa', role: 'Project Coordinator', progress: 30, taskCount: 8, priority: 'Medium' }
    ],
    skills: [
      { name: 'Project Management', level: 'Intermediate', experienceYears: 3 },
      { name: 'Site Coordination', level: 'Advanced', experienceYears: 4 },
      { name: 'BOQ', level: 'Intermediate', experienceYears: 3 },
    ],
    performance: { taskCompletion: 91, onTime: 89, projectDelivery: 90, customerFollowUp: 85, learning: 80, meetingParticipation: 92, overall: 89 },
    learning: [
      { courseName: 'Advanced Excel for BOQ', progress: 45 }
    ],
    workload: { openTasks: 21, dueToday: 5, overdue: 2, inProgress: 8, completed: 74, workloadPercentage: 88, status: 'HIGH' }
  },
  {
    id: 'U-004',
    employeeCode: 'EMP-0004',
    fullName: 'Jaya Jothi',
    email: 'jaya@minion.com',
    phone: '+91 9876543213',
    department: 'Sales',
    designation: 'Sales & Business Development Executive',
    reportingManagerId: 'U-001',
    reportingManagerName: 'Sivabalan Subramanian',
    employmentType: 'Full Time',
    joiningDate: '2021-06-01',
    workLocation: 'HQ - Chennai',
    status: 'Active',
    projects: [],
    skills: [
      { name: 'Sales', level: 'Advanced', experienceYears: 5 },
      { name: 'Business Development', level: 'Expert', experienceYears: 6 },
    ],
    performance: { taskCompletion: 95, onTime: 94, projectDelivery: 0, customerFollowUp: 98, learning: 85, meetingParticipation: 90, overall: 94 },
    learning: [],
    workload: { openTasks: 15, dueToday: 8, overdue: 0, inProgress: 4, completed: 140, workloadPercentage: 75, status: 'NORMAL' }
  },
  {
    id: 'U-005',
    employeeCode: 'EMP-0015',
    fullName: 'Gokul Krishnan',
    email: 'gokul@minion.com',
    phone: '+91 9876543224',
    department: 'Project Operations',
    designation: 'Intern',
    reportingManagerId: 'U-003',
    reportingManagerName: 'Rahul S A',
    employmentType: 'Intern',
    joiningDate: '2026-06-01',
    workLocation: 'HQ - Chennai',
    status: 'Intern',
    projects: [
      { id: 'PRJ-2026-0048', name: 'Kumar Residence', role: 'Site Support', progress: 78, taskCount: 4, priority: 'Low' }
    ],
    skills: [
      { name: 'Electrical', level: 'Beginner', experienceYears: 0 },
    ],
    performance: { taskCompletion: 85, onTime: 80, projectDelivery: 80, customerFollowUp: 70, learning: 95, meetingParticipation: 85, overall: 82 },
    learning: [
      { courseName: 'Smart Home Basics', progress: 100 },
      { courseName: 'Site Safety', progress: 60 }
    ],
    workload: { openTasks: 8, dueToday: 2, overdue: 0, inProgress: 2, completed: 24, workloadPercentage: 40, status: 'LOW' }
  }
];
