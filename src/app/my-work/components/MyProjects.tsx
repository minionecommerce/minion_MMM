'use client';

import { MapPin, Calendar, ChevronRight, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WorkProject } from '../data/mock';
import { useMyWork } from "../MyWorkContext";

const statusConfig = {
  on_track: { label: 'On Track', class: 'text-green-400 bg-green-400/10' },
  critical: { label: 'Critical', class: 'text-red-400 bg-red-400/10' },
  completed: { label: 'Completed', class: 'text-blue-400 bg-blue-400/10' },
  delayed: { label: 'Delayed', class: 'text-orange-400 bg-orange-400/10' },
};

function ProgressBar({ value, status }: { value: number; status: WorkProject['status'] }) {
  const colorMap = {
    on_track: 'bg-green-500',
    critical: 'bg-red-500',
    completed: 'bg-blue-500',
    delayed: 'bg-orange-500',
  };
  return (
    <div className="w-full bg-[#0D0D0F] rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorMap[status]}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function MyProjects() {
  const { projects } = useMyWork();

  const displayProjects = projects.slice(0, 4);

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-[15px] font-bold text-white">My Projects</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">Projects currently assigned to you.</p>
        </div>
        <button className="text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
          View All →
        </button>
      </div>

      {/* Projects Grid */}
      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayProjects.map((project) => {
          const status = statusConfig[project.status];
          return (
            <div
              key={project.id}
              className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all cursor-pointer group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[13px] font-bold text-white group-hover:text-yellow-50 transition-colors">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{project.subtitle}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2 ${status.class}`}>
                  {status.label}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500">Progress</span>
                  <span className="text-[12px] font-bold text-white">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} status={project.status} />
              </div>

              {/* Next Action */}
              <div className="flex items-center gap-1.5 mb-3">
                {project.status === 'critical'
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                }
                <span className="text-[11px] text-gray-400">
                  <span className="text-gray-600">Next: </span>
                  {project.nextAction}
                </span>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {project.teamSize}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1e2025]">
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {project.dueDate}
                </div>
                <button className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
                  Open Project <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
