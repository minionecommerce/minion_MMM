export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  type: 'Video' | 'Document' | 'Quiz' | 'Practical';
}

export interface Module {
  id: string;
  title: string;
  completed: boolean;
  locked: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  durationHours: number;
  totalLessons: number;
  progress: number;
  trainer: string;
  status: CourseStatus;
  dueDate?: string;
  modules: Module[];
  description: string;
  skillsCovered: string[];
}

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date
  time: string; // HH:MM AM/PM - HH:MM AM/PM
  trainer: string;
  topic: string;
  participants: number;
  attendance: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  mandatory: boolean;
  myStatus?: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Pending';
}

export interface Certification {
  id: string;
  name: string;
  issuedDate: string;
  expiryDate?: string;
  provider: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Pending';
}

export interface SkillProgress {
  name: string;
  level: Difficulty;
  progress: number;
  targetLevel: Difficulty;
}

// --- MOCK DATA ---

export const mockCourses: Course[] = [
  {
    id: 'CRS-2026-0001',
    name: 'Zoho CRM Development',
    category: 'Technical Skills',
    difficulty: 'Advanced',
    durationHours: 18,
    totalLessons: 16,
    progress: 78,
    trainer: 'Dinesh Subramanian',
    status: 'In Progress',
    dueDate: '2026-10-15T00:00:00Z',
    description: 'Master advanced Zoho CRM development including Deluge scripting, workflow automations, and custom functions.',
    skillsCovered: ['Zoho CRM', 'Deluge', 'Automation', 'API Integration'],
    modules: [
      {
        id: 'MOD-1', title: 'CRM Fundamentals', completed: true, locked: false, lessons: [
          { id: 'LES-1', title: 'Introduction to Zoho', durationMinutes: 15, completed: true, type: 'Video' },
          { id: 'LES-2', title: 'Setting up Modules', durationMinutes: 20, completed: true, type: 'Video' }
        ]
      },
      {
        id: 'MOD-2', title: 'Leads & Contacts', completed: true, locked: false, lessons: [
          { id: 'LES-3', title: 'Lead Scoring', durationMinutes: 30, completed: true, type: 'Video' }
        ]
      },
      {
        id: 'MOD-3', title: 'Deals & Pipeline', completed: true, locked: false, lessons: [
          { id: 'LES-4', title: 'Pipeline Stages', durationMinutes: 25, completed: true, type: 'Video' }
        ]
      },
      {
        id: 'MOD-4', title: 'Deluge Development', completed: false, locked: false, lessons: [
          { id: 'LES-5', title: 'Variables and Conditionals', durationMinutes: 45, completed: true, type: 'Video' },
          { id: 'LES-6', title: 'Creating CRM Automation', durationMinutes: 32, completed: false, type: 'Practical' }
        ]
      },
      {
        id: 'MOD-5', title: 'Automation', completed: false, locked: true, lessons: [
          { id: 'LES-7', title: 'Workflow Rules', durationMinutes: 40, completed: false, type: 'Video' }
        ]
      },
      {
        id: 'MOD-6', title: 'Projects Integration', completed: false, locked: true, lessons: [
          { id: 'LES-8', title: 'Syncing CRM and Projects', durationMinutes: 50, completed: false, type: 'Video' }
        ]
      }
    ]
  },
  {
    id: 'CRS-2026-0002',
    name: 'Project Management',
    category: 'Professional Skills',
    difficulty: 'Intermediate',
    durationHours: 12,
    totalLessons: 12,
    progress: 64,
    trainer: 'Sivabalan Subramanian',
    status: 'In Progress',
    dueDate: '2026-10-20T00:00:00Z',
    description: 'Learn the core principles of managing smart home and interior execution projects from initiation to handover.',
    skillsCovered: ['Project Management', 'Cost Control', 'Team Coordination'],
    modules: []
  },
  {
    id: 'CRS-2026-0003',
    name: 'Smart Home Automation',
    category: 'Technical Skills',
    difficulty: 'Advanced',
    durationHours: 24,
    totalLessons: 20,
    progress: 92,
    trainer: 'Dinesh Subramanian',
    status: 'In Progress',
    dueDate: '2026-10-05T00:00:00Z',
    description: 'Deep dive into smart switches, controllers, sensors, and network configurations.',
    skillsCovered: ['Home Automation', 'Electrical', 'Networking'],
    modules: []
  },
  {
    id: 'CRS-2026-0004',
    name: 'Communication Skills',
    category: 'Professional Skills',
    difficulty: 'Beginner',
    durationHours: 6,
    totalLessons: 8,
    progress: 100,
    trainer: 'External Trainer',
    status: 'Completed',
    description: 'Effective communication with clients, team members, and stakeholders.',
    skillsCovered: ['Communication', 'Customer Service'],
    modules: []
  }
];

export const mockSessions: Session[] = [
  {
    id: 'SESS-1',
    name: 'Employee Learning Skills',
    date: '2026-09-29T18:00:00Z',
    time: '06:00 PM – 06:30 PM',
    trainer: 'Dinesh Subramanian',
    topic: 'CRM Follow-up Best Practices',
    participants: 18,
    attendance: 14,
    status: 'Scheduled',
    mandatory: true,
    myStatus: 'Pending'
  },
  {
    id: 'SESS-2',
    name: 'Weekly Training',
    date: '2026-09-30T17:00:00Z',
    time: '05:00 PM – 06:00 PM',
    trainer: 'Abishek Subramanian',
    topic: 'Interior Design Basics for Sales',
    participants: 12,
    attendance: 0,
    status: 'Scheduled',
    mandatory: false,
    myStatus: 'Pending'
  },
  {
    id: 'SESS-3',
    name: 'Employee Learning Skills',
    date: '2026-09-28T18:00:00Z',
    time: '06:00 PM – 06:30 PM',
    trainer: 'Dinesh Subramanian',
    topic: 'Site Measurement SOPs',
    participants: 18,
    attendance: 16,
    status: 'Completed',
    mandatory: true,
    myStatus: 'Present'
  }
];

export const mockCertifications: Certification[] = [
  { id: 'CERT-1', name: 'Zoho CRM Developer', issuedDate: '2026-09-10T00:00:00Z', provider: 'Zoho', status: 'Active' },
  { id: 'CERT-2', name: 'Smart Home Automation Specialist', issuedDate: '2025-08-20T00:00:00Z', expiryDate: '2026-08-20T00:00:00Z', provider: 'Minion Internal', status: 'Expired' },
];

export const mockSkills: SkillProgress[] = [
  { name: 'Project Management', level: 'Advanced', progress: 85, targetLevel: 'Expert' },
  { name: 'CRM', level: 'Intermediate', progress: 72, targetLevel: 'Advanced' },
  { name: 'Home Automation', level: 'Advanced', progress: 91, targetLevel: 'Expert' },
  { name: 'Customer Communication', level: 'Advanced', progress: 88, targetLevel: 'Advanced' },
  { name: 'Leadership', level: 'Intermediate', progress: 64, targetLevel: 'Advanced' },
];
