'use client';

import { Plus, Download, Filter, Users, UserPlus, Network, FolderKanban, Shield } from 'lucide-react';
import Link from 'next/link';

interface TeamHeaderProps {
  onAddEmployee?: () => void;
  onOrganization?: () => void;
  onCreateTeam?: () => void;
  onAssignTeam?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
}

export default function TeamHeader({
  onAddEmployee,
  onOrganization,
  onCreateTeam,
  onAssignTeam,
  onExport,
  onFilter
}: TeamHeaderProps) {
  return (
    <div className="px-6 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-yellow-400" />
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-white">TEAM</h1>
        </div>
        <p className="text-[13px] text-gray-400 max-w-xl font-medium">
          People, roles, responsibilities and performance across Minion.
          <br className="hidden sm:block" />
          <span className="text-gray-500">Manage your people, organizational structure and team workload from one place.</span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button 
          onClick={onOrganization}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all"
        >
          <Network className="w-3.5 h-3.5" />
          Organization
        </button>
        <button 
          onClick={onFilter}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all"
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
        <button 
          onClick={onExport}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        
        <div className="w-px h-6 bg-[#292B30] mx-1 hidden lg:block" />

        <Link 
          href="/users/roles"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-purple-400/50 text-[12px] font-semibold text-gray-300 hover:text-purple-400 transition-all"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Manage Roles</span>
        </Link>
        
        <button 
          onClick={onAssignTeam}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-blue-400/50 text-[12px] font-semibold text-gray-300 hover:text-blue-400 transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Assign Team</span>
        </button>
        <button 
          onClick={onCreateTeam}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-green-400/50 text-[12px] font-semibold text-gray-300 hover:text-green-400 transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Department</span>
        </button>
        <button 
          onClick={onAddEmployee}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[12px] font-bold text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)]"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>
    </div>
  );
}

