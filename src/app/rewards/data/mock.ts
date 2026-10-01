export interface RewardEmployee {
  id: string;
  name: string;
  designation: string;
  level: string;
  points: number;
  currentRevenue: number;
  nextMilestoneTarget: number;
  nextMilestoneName: string;
  nextMilestoneReward: string;
}

export interface SummaryData {
  myPoints: string;
  achievements: string;
  currentMilestone: string;
  rewardsEarned: string;
  teamRecognitions: string;
  pendingRewards: string;
}

export interface Milestone {
  id: string;
  targetAmount: number;
  targetLabel: string; // e.g. "₹22 LAKHS"
  status: 'Completed' | 'In Progress' | 'Locked';
  achievedDate?: string;
  rewardName: string;
  currentProgress: number; // For "In Progress"
  remaining: number;
}

export interface EligibilityCriterion {
  id: string;
  name: string; // e.g. "Start Meetings"
  current: number;
  required: number;
  status: 'Completed' | 'Pending';
  label?: string; // e.g. "82 / 70"
}

export interface CategoryData {
  id: string;
  name: string;
  iconType: string;
  achievementCount: number;
  pointsEarned: number;
  latestAchievement: string;
}

// MOCK DATA

export const mockEmployee: RewardEmployee = {
  id: 'EMP-1',
  name: 'Dinesh Subramanian',
  designation: 'Chief Project Manager',
  level: 'GROWTH LEADER',
  points: 1280,
  currentRevenue: 2240000,
  nextMilestoneTarget: 2500000,
  nextMilestoneName: '₹25 LAKHS',
  nextMilestoneReward: 'Achievement Recognition + Wellness Benefit',
};

export const mockSummary: SummaryData = {
  myPoints: '1,280',
  achievements: '18',
  currentMilestone: '₹22L Revenue',
  rewardsEarned: '₹48,500',
  teamRecognitions: '24',
  pendingRewards: '3',
};

export const mockMilestones: Milestone[] = [
  {
    id: 'MS-10L',
    targetAmount: 1000000,
    targetLabel: '₹10 LAKHS',
    status: 'Completed',
    achievedDate: '12 Aug 2026',
    rewardName: 'Token of Appreciation',
    currentProgress: 1000000,
    remaining: 0,
  },
  {
    id: 'MS-15L',
    targetAmount: 1500000,
    targetLabel: '₹15 LAKHS',
    status: 'Completed',
    achievedDate: '28 Aug 2026',
    rewardName: 'Performance Certificate',
    currentProgress: 1500000,
    remaining: 0,
  },
  {
    id: 'MS-22L',
    targetAmount: 2200000,
    targetLabel: '₹22 LAKHS',
    status: 'Completed',
    achievedDate: '15 Sep 2026',
    rewardName: 'Bike Incentive Eligibility',
    currentProgress: 2200000,
    remaining: 0,
  },
  {
    id: 'MS-25L',
    targetAmount: 2500000,
    targetLabel: '₹25 LAKHS',
    status: 'In Progress',
    rewardName: 'Achievement Recognition + Wellness Benefit',
    currentProgress: 2240000,
    remaining: 260000,
  },
  {
    id: 'MS-50L',
    targetAmount: 5000000,
    targetLabel: '₹50 LAKHS',
    status: 'Locked',
    rewardName: 'Travel Sponsorship',
    currentProgress: 0,
    remaining: 5000000,
  }
];

export const mockEligibility: EligibilityCriterion[] = [
  { id: 'E1', name: 'Revenue Achievement', current: 1, required: 1, status: 'Completed', label: 'Completed' },
  { id: 'E2', name: 'Start Meetings', current: 82, required: 70, status: 'Completed', label: '82 / 70' },
  { id: 'E3', name: 'Day Close Meetings', current: 91, required: 70, status: 'Completed', label: '91 / 70' },
  { id: 'E4', name: 'Weekly Meetings', current: 14, required: 10, status: 'Completed', label: '14 / 10' },
  { id: 'E5', name: 'Monthly Meetings', current: 4, required: 3, status: 'Completed', label: '4 / 3' },
  { id: 'E6', name: 'Quarterly Meetings', current: 1, required: 1, status: 'Completed', label: 'Completed' },
  { id: 'E7', name: 'Impact Points', current: 67, required: 50, status: 'Completed', label: '67 / 50' },
];

export const mockCategories: CategoryData[] = [
  { id: 'C1', name: 'Revenue Achievement', iconType: 'Target', achievementCount: 4, pointsEarned: 500, latestAchievement: '₹22L Milestone Reached' },
  { id: 'C2', name: 'Project Excellence', iconType: 'FolderKanban', achievementCount: 6, pointsEarned: 300, latestAchievement: 'Flawless Handover - Villa 42' },
  { id: 'C3', name: 'Customer Excellence', iconType: 'Star', achievementCount: 3, pointsEarned: 150, latestAchievement: '5-Star Feedback Received' },
  { id: 'C4', name: 'Learning & Skills', iconType: 'BookOpen', achievementCount: 8, pointsEarned: 240, latestAchievement: 'Advanced CRM Certification' },
  { id: 'C5', name: 'Volunteering & Impact', iconType: 'Heart', achievementCount: 2, pointsEarned: 50, latestAchievement: 'Community Tech Mentorship' },
  { id: 'C6', name: 'Team Contribution', iconType: 'Users', achievementCount: 4, pointsEarned: 40, latestAchievement: 'Mentored Junior Staff' },
];
