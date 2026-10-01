'use client';

import { ChevronRight } from 'lucide-react';

interface PipelineStage {
  key: string;
  label: string;
  statuses: string[];
  color: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'NEW', label: 'NEW', statuses: ['New'], color: 'blue' },
  { key: 'CONTACTED', label: 'CONTACTED', statuses: ['Contacted'], color: 'cyan' },
  { key: 'REQUIREMENTS', label: 'REQUIREMENTS', statuses: ['Requirements Collected'], color: 'indigo' },
  { key: 'PRELIM QUOTE', label: 'PRELIM QUOTE', statuses: ['Preliminary Quote Sent'], color: 'yellow' },
  { key: 'FOLLOW-UP', label: 'FOLLOW-UP', statuses: ['Follow-up'], color: 'orange' },
  { key: 'SITE VISIT', label: 'SITE VISIT', statuses: ['Site Visit Scheduled', 'Site Visit Completed'], color: 'purple' },
  { key: 'FINAL QUOTE', label: 'FINAL QUOTE', statuses: ['Final Quote Sent'], color: 'amber' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', statuses: ['Negotiation'], color: 'pink' },
  { key: 'DEAL WON', label: 'DEAL WON', statuses: ['Won'], color: 'green' },
];

function formatValue(val: number) {
  if (!val || val === 0) return '—';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

interface CRMPipelineProps {
  activeStage: string | null;
  onStageClick: (stage: string | null) => void;
  statusGroups: Array<{ status: string; _count: { _all: number }; _sum: { expectedValue: number | null } }>;
}

export default function CRMPipeline({ activeStage, onStageClick, statusGroups }: CRMPipelineProps) {
  // Build count/value map from real data
  const countMap: Record<string, { count: number; value: number }> = {};
  for (const grp of statusGroups) {
    countMap[grp.status] = {
      count: grp._count._all,
      value: Number(grp._sum.expectedValue || 0),
    };
  }

  const getStageData = (stage: PipelineStage) => {
    let count = 0;
    let value = 0;
    for (const status of stage.statuses) {
      if (countMap[status]) {
        count += countMap[status].count;
        value += countMap[status].value;
      }
    }
    return { count, value };
  };

  return (
    <div className="px-6 pb-4">
      <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <h2 className="text-[14px] font-bold text-white">Sales Pipeline</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Click a stage to filter records — real-time from database</p>
          </div>
          {activeStage && (
            <button
              onClick={() => onStageClick(null)}
              className="text-[11px] text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
            >
              Clear filter ×
            </button>
          )}
        </div>

        <div className="overflow-x-auto no-scrollbar pb-4 px-5">
          <div className="flex items-stretch gap-0 min-w-max">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isActive = activeStage === stage.key;
              const isLast = idx === PIPELINE_STAGES.length - 1;
              const { count, value } = getStageData(stage);

              return (
                <div key={stage.key} className="flex items-center">
                  <button
                    onClick={() => onStageClick(isActive ? null : stage.key)}
                    className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[110px] rounded-xl border transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-yellow-400 border-yellow-400 text-black'
                        : 'bg-[#0D0D0F] border-[#292B30] text-gray-300 hover:border-yellow-400/40 hover:bg-[#1a1b1e]'
                    }`}
                  >
                    <span className={`text-[10px] font-bold tracking-wider uppercase text-center leading-tight mb-2 ${isActive ? 'text-black' : 'text-gray-500'}`}>
                      {stage.label}
                    </span>
                    <span className={`text-2xl font-bold leading-none ${isActive ? 'text-black' : 'text-white'}`}>
                      {String(count).padStart(2, '0')}
                    </span>
                    <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-black/70' : 'text-yellow-400'}`}>
                      {formatValue(value)}
                    </span>
                  </button>

                  {!isLast && (
                    <ChevronRight className={`w-4 h-4 mx-1 shrink-0 ${isActive ? 'text-yellow-400' : 'text-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
