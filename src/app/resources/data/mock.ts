export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'Image' | 'Video' | 'Folder' | 'Link';
  category: string;
  department: string;
  size?: string;
  version: string;
  updatedAt: string;
  owner: string;
  isFavorite: boolean;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Archived';
  tags: string[];
}

export interface SummaryData {
  totalResources: number;
  documents: number;
  templates: number;
  sopsAndPolicies: number;
  recentlyAdded: number;
  mySaved: number;
}

export interface ResourceCategory {
  id: string;
  name: string;
  iconType: string;
  count: number;
}

// MOCK DATA

export const mockSummary: SummaryData = {
  totalResources: 1284,
  documents: 642,
  templates: 126,
  sopsAndPolicies: 84,
  recentlyAdded: 18,
  mySaved: 32,
};

export const mockCategories: ResourceCategory[] = [
  { id: 'C1', name: 'Company', iconType: 'Building', count: 45 },
  { id: 'C2', name: 'SOPs', iconType: 'FileText', count: 62 },
  { id: 'C3', name: 'Policies', iconType: 'Shield', count: 22 },
  { id: 'C4', name: 'HR', iconType: 'Users', count: 115 },
  { id: 'C5', name: 'Finance', iconType: 'CreditCard', count: 88 },
  { id: 'C6', name: 'CRM', iconType: 'Target', count: 140 },
  { id: 'C7', name: 'Projects', iconType: 'FolderKanban', count: 320 },
  { id: 'C8', name: 'Products', iconType: 'Box', count: 410 },
  { id: 'C9', name: 'Templates', iconType: 'LayoutTemplate', count: 126 },
  { id: 'C10', name: 'Marketing', iconType: 'Megaphone', count: 180 },
];

export const mockQuickAccess: Resource[] = [
  {
    id: 'QA1',
    title: 'Company Profile 2026',
    description: 'Latest Minion company profile and overview.',
    type: 'PDF',
    category: 'Company',
    department: 'Management',
    size: '4.2 MB',
    version: 'v2.1',
    updatedAt: '2026-09-15',
    owner: 'Management',
    isFavorite: true,
    status: 'Published',
    tags: ['company', 'profile', 'sales']
  },
  {
    id: 'QA2',
    title: 'Project Handover SOP',
    description: 'Standard operating procedure for project handovers.',
    type: 'PDF',
    category: 'SOPs',
    department: 'Projects',
    size: '1.8 MB',
    version: 'v1.4',
    updatedAt: '2026-08-20',
    owner: 'Projects Team',
    isFavorite: false,
    status: 'Published',
    tags: ['sop', 'projects', 'handover']
  },
  {
    id: 'QA3',
    title: 'Standard BOQ Template',
    description: 'Approved template for standard smart home BOQ.',
    type: 'XLSX',
    category: 'Templates',
    department: 'Sales',
    size: '850 KB',
    version: 'v3.0',
    updatedAt: '2026-09-28',
    owner: 'Finance',
    isFavorite: true,
    status: 'Published',
    tags: ['template', 'boq', 'sales', 'finance']
  },
  {
    id: 'QA4',
    title: 'Site Visit Checklist',
    description: 'Required checklist for all preliminary site visits.',
    type: 'DOCX',
    category: 'Templates',
    department: 'Projects',
    size: '120 KB',
    version: 'v1.2',
    updatedAt: '2026-07-10',
    owner: 'Projects Team',
    isFavorite: false,
    status: 'Published',
    tags: ['checklist', 'site visit', 'projects']
  }
];

export const mockRecentResources: Resource[] = [
  {
    id: 'RR1',
    title: 'Q3 Product Catalog - Automation',
    description: 'Updated catalog including new smart switches.',
    type: 'PDF',
    category: 'Products',
    department: 'Marketing',
    size: '12.5 MB',
    version: 'v1.0',
    updatedAt: '2 hours ago',
    owner: 'Marketing',
    isFavorite: false,
    status: 'Published',
    tags: ['catalog', 'products', 'automation']
  },
  {
    id: 'RR2',
    title: 'Vendor Payment Request Form',
    description: 'Updated PR form for Q4 2026.',
    type: 'DOCX',
    category: 'Forms',
    department: 'Finance',
    size: '45 KB',
    version: 'v2.2',
    updatedAt: '5 hours ago',
    owner: 'Finance',
    isFavorite: false,
    status: 'Published',
    tags: ['form', 'finance', 'vendor']
  },
  {
    id: 'RR3',
    title: 'PARE Soffit Installation Guide',
    description: 'Technical installation manual for PARE Soffit panels.',
    type: 'PDF',
    category: 'Technical',
    department: 'Projects',
    size: '8.4 MB',
    version: 'v1.1',
    updatedAt: '1 day ago',
    owner: 'Technical Team',
    isFavorite: true,
    status: 'Published',
    tags: ['pare', 'installation', 'technical']
  },
  {
    id: 'RR4',
    title: 'Q4 Sales Kickoff Presentation',
    description: 'Slides from the October sales meeting.',
    type: 'PPTX',
    category: 'Company',
    department: 'Sales',
    size: '24.1 MB',
    version: 'v1.0',
    updatedAt: '2 days ago',
    owner: 'Sales VP',
    isFavorite: false,
    status: 'Published',
    tags: ['presentation', 'sales', 'q4']
  }
];
