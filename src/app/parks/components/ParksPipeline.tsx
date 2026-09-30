'use client';

import { ParkStage, parkStages } from '../data/mock';

interface ParksPipelineProps {
  landscapes?: any[];
  activeStage: ParkStage | null;
  onStageClick: (stage: ParkStage | null) => void;
}

export default function ParksPipeline({ landscapes = [], activeStage, onStageClick }: ParksPipelineProps) {
  const formatValue = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const stageData = parkStages.reduce((acc, stage) => {
    const matching = landscapes.filter(l => (l.stage || 'ENQUIRY').toUpperCase() === stage.toUpperCase());
    const count = matching.length;
    const valSum = matching.reduce((sum, l) => sum + Number(l.value || 0), 0);
    acc[stage] = { count, value: formatValue(valSum) };
    return acc;
  }, {} as Record<string, { count: number; value: string }>);
  
  return (
    <div className="px-6 pb-6">
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max">
          {parkStages.map((stage, idx) => {
            const data = stageData[stage] || { count: 0, value: '₹0' };
            const isFirst = idx === 0;
            const isActive = activeStage === stage;
            
            return (
              <div key={stage} className="flex items-center">
                {!isFirst && (
                  <div className="w-8 h-px bg-[#292B30] mx-2" />
                )}
                <button
                  onClick={() => onStageClick(isActive ? null : stage)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border min-w-[120px] transition-all group ${
                    isActive 
                      ? 'bg-yellow-400/10 border-yellow-400/50' 
                      : 'bg-[#0D0D0F] border-[#292B30] hover:border-gray-500'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider mb-2 transition-colors ${
                    isActive ? 'text-yellow-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`}>
                    {stage}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-black border transition-all mb-1 ${
                    isActive 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_rgba(255,196,0,0.3)]' 
                      : 'bg-[#151619] text-white border-[#292B30] group-hover:border-gray-500'
                  }`}>
                    {data.count.toString().padStart(2, '0')}
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-yellow-400/80' : 'text-gray-500'
                  }`}>
                    {data.value}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

