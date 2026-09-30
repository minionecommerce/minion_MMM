'use client';

import { useState } from 'react';

import LearningHeader from './components/LearningHeader';
import LearningSummaryCards from './components/LearningSummaryCards';
import LearningTabs from './components/LearningTabs';
import MyLearning from './components/MyLearning';
import CoursesTab from './components/CoursesTab';
import CertificationsTab from './components/CertificationsTab';
import LearningPathsTab from './components/LearningPathsTab';
import SkillsTab from './components/SkillsTab';
import { mockCourses, mockSessions, mockSkills } from './data/mock';

export default function LearningClient({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col relative overflow-x-hidden">
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto">
        <LearningHeader />
        
        {/* Only show cards on top level tabs */}
        {(activeTab === 'Overview' || activeTab === 'My Learning') && (
          <LearningSummaryCards />
        )}

        <LearningTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="px-6 py-8">
          
          {(activeTab === 'Overview' || activeTab === 'My Learning') && (
            <MyLearning 
              courses={mockCourses}
              sessions={mockSessions}
              skills={mockSkills}
            />
          )}

          {activeTab === 'Courses' && (
            <CoursesTab courses={mockCourses} />
          )}

          {activeTab === 'Learning Paths' && (
            <LearningPathsTab />
          )}

          {activeTab === 'Skills' && (
            <SkillsTab skills={mockSkills} />
          )}

          {activeTab === 'Certifications' && (
            <CertificationsTab />
          )}

          {/* Placeholders for other tabs */}
          {['Sessions', 'Assessments', 'Resources'].includes(activeTab) && (
            <div className="text-center py-20 text-gray-500 bg-[#151619] border border-[#292B30] rounded-xl">
              <div className="text-3xl mb-3 opacity-50">🚧</div>
              <h3 className="text-[14px] font-bold text-white mb-2">{activeTab} Details</h3>
              <p className="text-[12px]">This learning section is coming soon.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
