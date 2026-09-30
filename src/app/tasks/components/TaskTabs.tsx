'use client';

interface TaskTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ['My Tasks', 'All Tasks', 'Team', 'Projects', 'Task Lists', 'Calendar', 'Completed'];

export default function TaskTabs({ activeTab, onTabChange }: TaskTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-[#111113] border-y border-[#292B30] px-6 py-2 overflow-x-auto no-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors ${
            activeTab === tab 
              ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.2)]' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
