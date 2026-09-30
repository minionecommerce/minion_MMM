'use client';

import { Project } from '../../data/mock';
import { ArrowLeft, MapPin, User, MoreHorizontal, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface ProjectDetailsHeaderProps {
  project: Project;
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

export default function ProjectDetailsHeader({ project }: ProjectDetailsHeaderProps) {
  return (
    <div className="bg-[#111113] border-b border-[#292B30] px-6 py-5">
      <div className="max-w-[1700px] mx-auto">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-yellow-400 uppercase tracking-wider mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[24px] font-black tracking-tight text-white">{project.name}</h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusColors[project.status] ?? 'bg-gray-400/10 text-gray-400'}`}>
                {project.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Project ID:</span>
                <span className="text-[12px] font-mono text-yellow-400">{project.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Customer:</span>
                <span className="text-[12px] font-semibold text-gray-300">{project.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-[12px] text-gray-400">{project.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-[12px] text-gray-400">{project.projectManager}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Project Progress</div>
              <div className="flex items-center gap-2">
                <div className="text-[20px] font-black text-white leading-none">{project.progress}%</div>
                <div className="w-24 h-2 bg-[#151619] rounded-full overflow-hidden border border-[#292B30]">
                  <div 
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-[#292B30] mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-lg bg-[#151619] border border-[#292B30] flex items-center justify-center hover:border-gray-500 text-gray-400 hover:text-white transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[12px] font-bold text-black transition-all">
                Project Actions <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  );
}
