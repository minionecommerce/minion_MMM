'use client';


import ResourcesHeader from './components/ResourcesHeader';
import ResourcesSummaryCards from './components/ResourcesSummaryCards';
import ResourcesSearch from './components/ResourcesSearch';
import ResourceCategories from './components/ResourceCategories';
import QuickAccess from './components/QuickAccess';
import RecentResources from './components/RecentResources';
import { mockCategories, mockQuickAccess, mockRecentResources } from './data/mock';

export default function ResourcesClient({ initialData }: { initialData: any }) {
  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col relative overflow-x-hidden">
      

      <main className="flex-1 w-full max-w-[1700px] mx-auto pb-12">
        <ResourcesHeader />
        
        <ResourcesSummaryCards />
        
        <ResourcesSearch />

        <div className="px-6 py-2 space-y-10">
          <ResourceCategories categories={mockCategories} />
          
          <QuickAccess resources={mockQuickAccess} />

          <RecentResources resources={mockRecentResources} />
        </div>
      </main>
    </div>
  );
}
