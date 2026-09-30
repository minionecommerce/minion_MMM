'use client';

import { Issue } from '../../data/mock';
import { AlertTriangle, Plus, MessageSquare } from 'lucide-react';

interface ProjectIssuesProps {
  issues: Issue[];
}

const severityColors: Record<string, string> = {
  'Low': 'bg-blue-400/10 text-blue-400',
  'Medium': 'bg-amber-400/10 text-amber-400',
  'High': 'bg-orange-400/10 text-orange-400',
  'Critical': 'bg-red-400/10 text-red-400',
};

const statusColors: Record<string, string> = {
  'Open': 'bg-red-400/10 text-red-400',
  'In Progress': 'bg-yellow-400/10 text-yellow-400',
  'Resolved': 'bg-green-400/10 text-green-400',
};

const getSeverityStyle = (severity?: string) => {
  const cls = (severity && severityColors[severity]) || 'bg-gray-400/10 text-gray-400';
  const border = cls.replace('bg-', 'border-').replace('/10', '/20');
  return `${border} ${cls}`;
};

const getStatusStyle = (status?: string) => {
  return (status && statusColors[status]) || 'bg-gray-400/10 text-gray-400';
};

export default function ProjectIssues({ issues }: ProjectIssuesProps) {
  const openIssues = issues.filter(i => i.status === 'Open').length;
  const criticalIssues = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">PROJECT ISSUES</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[12px] font-bold text-gray-400">Total: <span className="text-white">{issues.length}</span></span>
              <span className="text-[12px] font-bold text-red-400">Open: {openIssues}</span>
              <span className="text-[12px] font-bold text-orange-400">Critical: {criticalIssues}</span>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Report Issue
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {issues.map(issue => (
          <div key={issue.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white leading-tight mb-1">{issue.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500">{issue.id}</span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{issue.dateReported}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyle(issue.status)}`}>
                  {issue.status || 'Open'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getSeverityStyle(issue.severity)}`}>
                  {issue.severity || 'Medium'}
                </span>
              </div>
            </div>

            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3 mb-4">
              <p className="text-[12px] text-gray-300 leading-relaxed">{issue.description}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1e2025]">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Reported By</span>
                  <span className="text-[12px] text-white">{issue.reportedBy}</span>
                </div>
                {issue.assignedTo && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Assigned To</span>
                    <span className="text-[12px] text-white">{issue.assignedTo}</span>
                  </div>
                )}
              </div>
              
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 text-[11px] font-semibold text-gray-400 hover:text-yellow-400 rounded-lg transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Comments
              </button>
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#292B30] rounded-xl">
            <div className="text-[14px] font-semibold">No issues reported</div>
          </div>
        )}
      </div>

    </div>
  );
}
