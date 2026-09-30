'use client';

import { MoreHorizontal, ChevronRight, User, MapPin } from 'lucide-react';
import { Project } from '../data/mock';

interface ProjectTableProps {
  projects: Project[];
  onProjectClick: (id: string) => void;
}

const statusColors: Record<string, string> = {
  'Planning': 'bg-blue-400/10 text-blue-400',
  'Active': 'bg-green-400/10 text-green-400',
  'At Risk': 'bg-amber-400/10 text-amber-400',
  'Critical': 'bg-red-400/10 text-red-400',
  'On Hold': 'bg-gray-400/10 text-gray-400',
  'Completed': 'bg-teal-400/10 text-teal-400',
  'Cancelled': 'bg-red-400/10 text-red-400',
};

const stageColors: Record<string, string> = {
  'Planning': 'text-blue-400',
  'Procurement': 'text-purple-400',
  'Site Preparation': 'text-orange-400',
  'Execution': 'text-yellow-400',
  'Quality Check': 'text-pink-400',
  'Handover': 'text-cyan-400',
  'Completed': 'text-green-400',
};

export default function ProjectTable({ projects, onProjectClick }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 bg-[#151619] rounded-xl border border-[#292B30]">
        <div className="text-4xl mb-3">📁</div>
        <div className="text-[14px] font-semibold">No projects found</div>
        <div className="text-[12px] mt-1">Try adjusting your filters or create a new project</div>
      </div>
    );
  }

  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="border-b border-[#292B30] bg-[#111113]">
            {['Project', 'Location', 'Manager', 'Progress', 'Stage', 'Value', 'Payment', 'Due Date', 'Status', ''].map(col => (
              <th key={col} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2025]">
          {projects.map(project => {
            const paymentPercent = Math.round((project.financials.receivedAmount / project.financials.totalContractValue) * 100) || 0;
            
            return (
              <tr
                key={project.id}
                onClick={() => onProjectClick(project.id)}
                className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors"
              >
                {/* Project Info */}
                <td className="px-4 py-3.5 pl-5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-yellow-400/80 hover:text-yellow-400 mb-0.5">{project.id}</span>
                    <span className="text-[13px] font-bold text-white leading-tight">{project.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-semibold text-gray-400">{project.customerName}</span>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{project.type}</span>
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                    <span className="truncate max-w-[120px]">{project.location}</span>
                  </div>
                </td>

                {/* Manager */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-300 font-semibold">
                    <User className="w-3 h-3 text-gray-500 shrink-0" />
                    <span className="truncate max-w-[100px]">{project.projectManager.split(' ')[0]}</span>
                  </div>
                </td>

                {/* Progress */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white w-8">{project.progress}%</span>
                    <div className="w-16 h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          project.progress === 100 ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Stage */}
                <td className="px-4 py-3.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${stageColors[project.stage] || 'text-gray-400'}`}>
                    {project.stage}
                  </span>
                </td>

                {/* Value */}
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-bold text-white">
                    ₹{project.financials.contractValue.toLocaleString('en-IN')}
                  </span>
                </td>

                {/* Payment */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-white">{paymentPercent}% Paid</span>
                    <span className="text-[10px] text-gray-500">₹{project.financials.receivedAmount.toLocaleString('en-IN')}</span>
                  </div>
                </td>

                {/* Due Date */}
                <td className="px-4 py-3.5">
                  <span className="text-[12px] font-semibold text-gray-300 whitespace-nowrap">
                    {new Date(project.expectedCompletion).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${statusColors[project.status] ?? 'bg-gray-400/10 text-gray-400'}`}>
                    {project.status}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3.5 pr-5 text-right">
                  <button className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
