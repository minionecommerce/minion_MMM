'use client';

import { ProjectStage, projectStages } from '../data/mock';

interface ProjectPipelineProps {
  projects?: any[];
  activeStage: ProjectStage | null;
  onStageClick: (stage: ProjectStage | null) => void;
}

export default function ProjectPipeline({ projects = [], activeStage, onStageClick }: ProjectPipelineProps) {
  // Calculate counts per stage dynamically
  const counts = projectStages.reduce((acc, stage) => {
    acc[stage] = projects.filter(p => p.stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="px-6 pb-6">
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max">
          {projectStages.map((stage, idx) => {
            const count = counts[stage] || 0;
            const isFirst = idx === 0;
            const isActive = activeStage === stage;
            
            return (
              <div key={stage} className="flex items-center">
                {!isFirst && (
                  <div className="w-10 h-px bg-[#292B30] mx-2" />
                )}
                <button
                  onClick={() => onStageClick(isActive ? null : stage)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border min-w-[120px] transition-all group ${
                    isActive 
                      ? 'bg-yellow-400/10 border-yellow-400/50' 
                      : 'bg-[#0D0D0F] border-[#292B30] hover:border-gray-500'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${
                    isActive ? 'text-yellow-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`}>
                    {stage}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-black border transition-all ${
                    isActive 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_rgba(255,196,0,0.3)]' 
                      : 'bg-[#151619] text-white border-[#292B30] group-hover:border-gray-500'
                  }`}>
                    {count.toString().padStart(2, '0')}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

