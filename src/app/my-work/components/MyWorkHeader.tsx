'use client';

import { Calendar, Plus } from 'lucide-react';

interface MyWorkHeaderProps {
  onAddTask: () => void;
  onAddFollowup: () => void;
}
import { useMyWork } from '../MyWorkContext';

export default function MyWorkHeader({ onAddTask, onAddFollowup }: MyWorkHeaderProps) {
  const { user } = useMyWork();
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const dateFormatted = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="px-6 pt-6 pb-4">
      {/* Page title row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left: greeting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-widest text-yellow-400 uppercase">My Work</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Here&apos;s everything that needs your attention today.
          </p>
        </div>

        {/* Right: date + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Date chip */}
          <div className="flex items-center gap-2.5 bg-[#1a1b1e] border border-[#292B30] rounded-xl px-4 py-2.5">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">{dayName}</span>
              <span className="text-sm font-bold text-white leading-none">{dateFormatted}</span>
            </div>
            <span className="ml-2 text-[10px] font-bold tracking-wider bg-yellow-400 text-black px-2 py-0.5 rounded-full">TODAY</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold px-3.5 py-2 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
            <button
              onClick={onAddFollowup}
              className="flex items-center gap-1.5 bg-[#1a1b1e] hover:bg-[#222326] border border-[#292B30] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Follow-up
            </button>
            <button className="flex items-center gap-1.5 bg-[#1a1b1e] hover:bg-[#222326] border border-[#292B30] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 active:scale-95">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
