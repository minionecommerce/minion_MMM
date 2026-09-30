'use client';

import { Department } from '../data/mock';
import { Users, FolderKanban, CheckSquare, Activity, ChevronRight } from 'lucide-react';

interface DepartmentCardsProps {
  departments: Department[];
}

export default function DepartmentCards({ departments }: DepartmentCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {departments.map(dept => (
        <div key={dept.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col h-full group">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-[14px] font-bold text-white tracking-wide">{dept.name}</h3>
            <div className="w-8 h-8 rounded bg-[#111113] border border-[#292B30] flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="mb-4">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Manager</span>
            <span className="text-[12px] font-bold text-gray-300">{dept.headName}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Members</span>
              </div>
              <span className="text-[16px] font-black text-white">{String(dept.memberCount).padStart(2, '0')}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <FolderKanban className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
              </div>
              <span className="text-[16px] font-black text-white">{String(dept.activeProjects).padStart(2, '0')}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <CheckSquare className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Tasks</span>
              </div>
              <span className="text-[16px] font-black text-white">{dept.openTasks}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Activity className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Perf.</span>
              </div>
              <span className="text-[16px] font-black text-green-400">{dept.completionRate}%</span>
            </div>
          </div>

          <button className="mt-auto w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-gray-500 hover:text-yellow-400 transition-colors">
            View Department <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      ))}
    </div>
  );
}
