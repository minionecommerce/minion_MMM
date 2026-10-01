'use client';

import { CheckSquare, AlertTriangle, Phone, FolderOpen, Activity, ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useMyWork } from "../MyWorkContext";

export default function WorkSummaryCards() {
  const { summary } = useMyWork();

  const { todaysTasks, overdue, followUps, projects, performance } = summary;

  return (
    <div className="px-6 pb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Card 1: Today's Tasks */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-black group cursor-pointer hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
              <CheckSquare className="w-4.5 h-4.5 text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Today&apos;s Tasks</span>
          </div>
          <div className="text-3xl font-bold text-black leading-none mb-2">
            {String(todaysTasks.total).padStart(2, '0')}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">{todaysTasks.dueToday} Due Today</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">{todaysTasks.inProgress} In Progress</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">{todaysTasks.pending} Pending</span>
            </div>
          </div>
        </div>

        {/* Card 2: Overdue */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-black group cursor-pointer hover:-translate-y-0.5 transition-all duration-200 border border-red-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Overdue</span>
          </div>
          <div className="text-3xl font-bold text-red-500 leading-none mb-2">
            {String(overdue.total).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-gray-500 mb-2">Needs Immediate Attention</div>
          <button className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors">
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Follow-ups */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-black group cursor-pointer hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
              <Phone className="w-4.5 h-4.5 text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Follow-ups</span>
          </div>
          <div className="text-3xl font-bold text-black leading-none mb-2">
            {String(followUps.total).padStart(2, '0')}
          </div>
          <div className="space-y-0.5 mb-2">
            <div className="text-[11px] text-gray-500">{followUps.dueToday} Due Today</div>
            <div className="text-[11px] text-gray-500">{followUps.upcoming} Upcoming</div>
          </div>
          <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-black transition-colors">
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: My Projects */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-black group cursor-pointer hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
              <FolderOpen className="w-4.5 h-4.5 text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">My Projects</span>
          </div>
          <div className="text-3xl font-bold text-black leading-none mb-2">
            {String(projects.total).padStart(2, '0')}
          </div>
          <div className="space-y-0.5 mb-2">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-gray-500">{projects.critical} Critical</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-gray-500">{projects.onTrack} On Track</span>
            </div>
          </div>
          <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-black transition-colors">
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: My Performance */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-black group cursor-pointer hover:-translate-y-0.5 transition-all duration-200 col-span-2 md:col-span-1">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
              <Activity className="w-4.5 h-4.5 text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">My Performance</span>
          </div>
          <div className="text-3xl font-bold text-black leading-none mb-1">
            {performance.value}%
          </div>
          <div className="text-[11px] text-gray-500 mb-2">This Month</div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
            <TrendingUp className="w-3.5 h-3.5" />
            ↑ {performance.vsLastMonth}% vs Last Month
          </div>
        </div>

      </div>
    </div>
  );
}
