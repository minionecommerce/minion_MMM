'use client';

import { Employee } from '../data/mock';
import { Mail, Phone, ChevronRight, CheckSquare, FolderKanban } from 'lucide-react';
import Link from 'next/link';

interface PeopleDirectoryProps {
  employees: Employee[];
  viewMode: 'grid' | 'list';
}

const statusColors: Record<string, string> = {
  'Active': 'bg-green-400/10 text-green-400 border-green-400/20',
  'On Leave': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'Remote': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'Probation': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'Intern': 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  'Notice Period': 'bg-orange-400/10 text-orange-400 border-orange-400/20',
};

export default function PeopleDirectory({ employees, viewMode }: PeopleDirectoryProps) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 bg-[#151619] rounded-xl border border-[#292B30]">
        <div className="text-4xl mb-3">👥</div>
        <div className="text-[14px] font-semibold">No employees found</div>
        <div className="text-[12px] mt-1">Adjust filters or add a new employee.</div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-[#292B30] bg-[#111113]">
              {['Employee', 'Department', 'Status', 'Projects', 'Tasks', 'Performance', ''].map(col => (
                <th key={col} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2025]">
            {employees.map(emp => (
              <tr key={emp.id} className="group hover:bg-[#1a1b1f] transition-colors">
                <td className="px-4 py-3 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-[12px] font-bold text-yellow-400 shrink-0">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white leading-tight">{emp.fullName}</span>
                      <span className="text-[11px] text-gray-500">{emp.designation}</span>
                      <span className="text-[9px] font-mono text-gray-600 mt-0.5">{emp.employeeCode}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] font-semibold text-gray-300">{emp.department}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${statusColors[emp.status] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-300">
                    <FolderKanban className="w-3.5 h-3.5 text-gray-500" />
                    {emp.projects.length}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-300">
                    <CheckSquare className="w-3.5 h-3.5 text-gray-500" />
                    {emp.workload.openTasks}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white w-8">{emp.performance.overall}%</span>
                    <div className="w-12 h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                      <div 
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: `${emp.performance.overall}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 pr-5 text-right">
                  <Link href={`/team/${emp.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 text-[11px] font-bold text-yellow-400 transition-colors opacity-0 group-hover:opacity-100">
                    Profile <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {employees.map(emp => (
        <div key={emp.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col h-full">
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-[16px] font-bold text-yellow-400 shrink-0">
                {emp.fullName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white leading-tight">{emp.fullName}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{emp.designation}</span>
                <span className="text-[10px] text-gray-600 font-mono mt-1">{emp.employeeCode}</span>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${statusColors[emp.status] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'}`}>
              {emp.status}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-gray-500 mb-4 pb-4 border-b border-[#292B30]">
            {emp.department}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Projects</span>
              <span className="text-[14px] font-bold text-white">{emp.projects.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tasks</span>
              <span className="text-[14px] font-bold text-white">{emp.workload.openTasks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Completion</span>
              <span className="text-[14px] font-bold text-green-400">{emp.performance.overall}%</span>
            </div>
          </div>

          <div className="mt-auto pt-4 flex gap-2">
            <Link href={`/team/${emp.id}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 rounded-lg text-[11px] font-bold text-yellow-400 transition-colors">
              View Profile <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      ))}
    </div>
  );
}
