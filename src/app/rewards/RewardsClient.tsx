'use client';

import { useState } from 'react';

import RewardsHeader from './components/RewardsHeader';
import RewardsSummaryCards from './components/RewardsSummaryCards';
import RewardsTabs from './components/RewardsTabs';
import MyRewardsHero from './components/MyRewardsHero';
import MilestoneTimeline from './components/MilestoneTimeline';
import RewardCategories from './components/RewardCategories';

import AchievementsTab from './components/AchievementsTab';
import MilestonesTab from './components/MilestonesTab';
import RecognitionTab from './components/RecognitionTab';
import PointsLedgerTab from './components/PointsLedgerTab';
import BadgesTab from './components/BadgesTab';
import ImpactTab from './components/ImpactTab';
import WellnessTab from './components/WellnessTab';
import LeaderboardTab from './components/LeaderboardTab';

import CreateAchievementModal from './components/CreateAchievementModal';
import GiveRecognitionModal from './components/GiveRecognitionModal';
import SubmitImpactModal from './components/SubmitImpactModal';
import SubmitWellnessModal from './components/SubmitWellnessModal';
import RequestReviewModal from './components/RequestReviewModal';
import AdminSettingsModal from './components/AdminSettingsModal';

export default function RewardsClient({ initialData, defaultTab = 'My Rewards' }: { initialData: any; defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Modals
  const [showCreateAchievement, setShowCreateAchievement] = useState(false);
  const [showGiveRecognition, setShowGiveRecognition] = useState(false);
  const [showSubmitImpact, setShowSubmitImpact] = useState(false);
  const [showSubmitWellness, setShowSubmitWellness] = useState(false);
  const [showRequestReview, setShowRequestReview] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  const rewards = initialData?.rewards || [];
  const ledgers = initialData?.ledgers || [];
  const employees = initialData?.employees || [];
  const totalRevenueValue = initialData?.totalRevenueValue || 0;
  const totalPointsEarned = initialData?.totalPointsEarned || 0;

  // Resolve active employee (first employee or default)
  const primaryEmployee = employees[0] || {};
  const primaryEmployeeName = primaryEmployee.user?.name || primaryEmployee.designation || 'Minion Employee';
  const primaryEmployeeNetPoints = ledgers
    .filter((l: any) => l.employeeId === primaryEmployee.id)
    .reduce((acc: number, l: any) => acc + (l.points || 0), 0);

  const dynamicEmployeeData = {
    id: primaryEmployee.id || 'EMP-1',
    name: primaryEmployeeName,
    designation: primaryEmployee.designation || 'Team Member',
    level: primaryEmployeeNetPoints >= 1000 ? 'GROWTH LEADER' : primaryEmployeeNetPoints >= 500 ? 'SENIOR EXPERT' : 'TEAM MEMBER',
    points: primaryEmployeeNetPoints > 0 ? primaryEmployeeNetPoints : totalPointsEarned,
    currentRevenue: totalRevenueValue,
    nextMilestoneTarget: totalRevenueValue < 2500000 ? 2500000 : 5000000,
    nextMilestoneName: totalRevenueValue < 2500000 ? '₹25 LAKHS' : '₹50 LAKHS',
    nextMilestoneReward: totalRevenueValue < 2500000 ? 'Family India Trip' : 'Family Trip / Wellness Experience',
  };

  // Dynamic Milestones Timeline
  const dynamicMilestones = [
    {
      id: 'MS-10L',
      targetAmount: 1000000,
      targetLabel: '₹10 LAKHS',
      status: (totalRevenueValue >= 1000000 ? 'Completed' : 'Locked') as any,
      achievedDate: totalRevenueValue >= 1000000 ? 'Achieved' : undefined,
      rewardName: 'Dinner Experience with Family',
      currentProgress: Math.min(1000000, totalRevenueValue),
      remaining: Math.max(0, 1000000 - totalRevenueValue),
    },
    {
      id: 'MS-18L',
      targetAmount: 1800000,
      targetLabel: '₹18 LAKHS',
      status: (totalRevenueValue >= 1800000 ? 'Completed' : totalRevenueValue >= 1000000 ? 'In Progress' : 'Locked') as any,
      rewardName: 'Wellness Activity Support',
      currentProgress: Math.min(1800000, totalRevenueValue),
      remaining: Math.max(0, 1800000 - totalRevenueValue),
    },
    {
      id: 'MS-22L',
      targetAmount: 2200000,
      targetLabel: '₹22 LAKHS',
      status: (totalRevenueValue >= 2200000 ? 'Completed' : totalRevenueValue >= 1800000 ? 'In Progress' : 'Locked') as any,
      rewardName: 'Bike Incentive Eligibility',
      currentProgress: Math.min(2200000, totalRevenueValue),
      remaining: Math.max(0, 2200000 - totalRevenueValue),
    },
    {
      id: 'MS-25L',
      targetAmount: 2500000,
      targetLabel: '₹25 LAKHS',
      status: (totalRevenueValue >= 2500000 ? 'Completed' : totalRevenueValue >= 2200000 ? 'In Progress' : 'Locked') as any,
      rewardName: 'Family India Trip',
      currentProgress: Math.min(2500000, totalRevenueValue),
      remaining: Math.max(0, 2500000 - totalRevenueValue),
    },
    {
      id: 'MS-50L',
      targetAmount: 5000000,
      targetLabel: '₹50 LAKHS',
      status: (totalRevenueValue >= 5000000 ? 'Completed' : totalRevenueValue >= 2500000 ? 'In Progress' : 'Locked') as any,
      rewardName: 'Wellness & Lifestyle Experience',
      currentProgress: Math.min(5000000, totalRevenueValue),
      remaining: Math.max(0, 5000000 - totalRevenueValue),
    }
  ];

  const dynamicEligibility = [
    { id: 'E1', name: 'Revenue Achievement', current: totalRevenueValue >= 2200000 ? 1 : 0, required: 1, status: (totalRevenueValue >= 2200000 ? 'Completed' : 'Pending') as any, label: totalRevenueValue >= 2200000 ? 'Completed' : 'Pending' },
    { id: 'E2', name: 'Start Meetings Participation', current: 82, required: 70, status: 'Completed' as any, label: '82 / 70' },
    { id: 'E3', name: 'Day Close Meetings', current: 91, required: 70, status: 'Completed' as any, label: '91 / 70' },
    { id: 'E4', name: 'Weekly Meetings', current: 14, required: 10, status: 'Completed' as any, label: '14 / 10' },
    { id: 'E5', name: 'Monthly Meetings', current: 4, required: 3, status: 'Completed' as any, label: '4 / 3' },
    { id: 'E6', name: 'Quarterly Meetings', current: 1, required: 1, status: 'Completed' as any, label: 'Completed' },
    { id: 'E7', name: 'Social Impact Points', current: ledgers.filter((l: any) => l.category === 'Impact').length * 50, required: 50, status: (ledgers.some((l: any) => l.category === 'Impact') ? 'Completed' : 'Pending') as any, label: `${ledgers.filter((l: any) => l.category === 'Impact').length * 50} / 50` },
  ];

  const dynamicCategories = [
    { id: 'C1', name: 'Revenue Achievement', iconType: 'Target', achievementCount: rewards.filter((r: any) => r.reason.toLowerCase().includes('revenue')).length || 1, pointsEarned: ledgers.filter((l: any) => l.category === 'Revenue Milestone').reduce((acc: number, l: any) => acc + l.points, 0) || 500, latestAchievement: '₹22L Milestone Reached' },
    { id: 'C2', name: 'Project Excellence', iconType: 'FolderKanban', achievementCount: rewards.filter((r: any) => r.reason.toLowerCase().includes('project')).length || 2, pointsEarned: ledgers.filter((l: any) => l.category === 'Project Excellence').reduce((acc: number, l: any) => acc + l.points, 0) || 300, latestAchievement: 'Flawless Project Handover' },
    { id: 'C3', name: 'Customer Excellence', iconType: 'Star', achievementCount: rewards.filter((r: any) => r.reason.toLowerCase().includes('customer')).length || 1, pointsEarned: ledgers.filter((l: any) => l.category === 'Customer Champion').reduce((acc: number, l: any) => acc + l.points, 0) || 150, latestAchievement: '5-Star Customer Feedback' },
    { id: 'C4', name: 'Learning & Skills', iconType: 'BookOpen', achievementCount: rewards.filter((r: any) => r.reason.toLowerCase().includes('learning')).length || 1, pointsEarned: ledgers.filter((l: any) => l.category === 'Learning Skill').reduce((acc: number, l: any) => acc + l.points, 0) || 240, latestAchievement: 'Skill Certification' },
    { id: 'C5', name: 'Volunteering & Impact', iconType: 'Heart', achievementCount: ledgers.filter((l: any) => l.category === 'Impact').length, pointsEarned: ledgers.filter((l: any) => l.category === 'Impact').reduce((acc: number, l: any) => acc + l.points, 0), latestAchievement: 'Community Volunteering' },
    { id: 'C6', name: 'Peer Recognition', iconType: 'Users', achievementCount: ledgers.filter((l: any) => l.category === 'Recognition').length, pointsEarned: ledgers.filter((l: any) => l.category === 'Recognition').reduce((acc: number, l: any) => acc + l.points, 0), latestAchievement: 'Peer Appreciation' },
  ];

  // CSV Export handler
  const handleExport = () => {
    const csvRows = [
      ['ID', 'Date', 'Employee ID', 'Source', 'Category', 'Description', 'Points'],
      ...ledgers.map((l: any) => [
        l.id,
        new Date(l.createdAt).toISOString(),
        l.employeeId,
        `"${l.source || ''}"`,
        `"${l.category || ''}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        l.points
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minion_rewards_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col relative overflow-x-hidden">
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto pb-12">
        <RewardsHeader
          onCreateAchievement={() => setShowCreateAchievement(true)}
          onGiveRecognition={() => setShowGiveRecognition(true)}
          onCreateReward={() => setShowCreateAchievement(true)}
          onExport={handleExport}
          onOpenSettings={() => setShowAdminSettings(true)}
        />
        
        {/* Only show summary cards on top level tabs */}
        {(activeTab === 'My Rewards' || activeTab === 'Achievements') && (
          <RewardsSummaryCards initialData={initialData} />
        )}

        <RewardsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="px-6 py-8 space-y-12">
          
          {activeTab === 'My Rewards' && (
            <>
              <MyRewardsHero employee={dynamicEmployeeData} />
              
              <div className="space-y-4">
                <MilestoneTimeline 
                  milestones={dynamicMilestones} 
                  eligibility={dynamicEligibility}
                  onRequestReview={() => setShowRequestReview(true)}
                />
              </div>

              <RewardCategories categories={dynamicCategories} />
            </>
          )}

          {activeTab === 'Achievements' && (
            <AchievementsTab
              rewards={rewards}
              employees={employees}
              onOpenCreate={() => setShowCreateAchievement(true)}
            />
          )}

          {activeTab === 'Milestones' && (
            <MilestonesTab
              totalRevenueValue={totalRevenueValue}
              onOpenCreate={() => setShowCreateAchievement(true)}
            />
          )}

          {activeTab === 'Recognition' && (
            <RecognitionTab
              ledgers={ledgers}
              employees={employees}
              onOpenGive={() => setShowGiveRecognition(true)}
            />
          )}

          {activeTab === 'Points Ledger' && (
            <PointsLedgerTab ledgers={ledgers} />
          )}

          {activeTab === 'Badges' && (
            <BadgesTab
              totalPoints={dynamicEmployeeData.points}
              totalRevenue={totalRevenueValue}
            />
          )}

          {activeTab === 'Impact' && (
            <ImpactTab
              ledgers={ledgers}
              employees={employees}
              onOpenSubmit={() => setShowSubmitImpact(true)}
            />
          )}

          {activeTab === 'Wellness' && (
            <WellnessTab
              ledgers={ledgers}
              employees={employees}
              onOpenSubmit={() => setShowSubmitWellness(true)}
            />
          )}

          {activeTab === 'Leaderboard' && (
            <LeaderboardTab
              employees={employees}
              ledgers={ledgers}
              rewards={rewards}
            />
          )}

        </div>
      </main>

      {/* Modals */}
      {showCreateAchievement && (
        <CreateAchievementModal
          employees={employees}
          onClose={() => setShowCreateAchievement(false)}
        />
      )}

      {showGiveRecognition && (
        <GiveRecognitionModal
          employees={employees}
          onClose={() => setShowGiveRecognition(false)}
        />
      )}

      {showSubmitImpact && (
        <SubmitImpactModal
          employees={employees}
          onClose={() => setShowSubmitImpact(false)}
        />
      )}

      {showSubmitWellness && (
        <SubmitWellnessModal
          employees={employees}
          onClose={() => setShowSubmitWellness(false)}
        />
      )}

      {showRequestReview && (
        <RequestReviewModal
          onClose={() => setShowRequestReview(false)}
        />
      )}

      {showAdminSettings && (
        <AdminSettingsModal
          onClose={() => setShowAdminSettings(false)}
        />
      )}
    </div>
  );
}


