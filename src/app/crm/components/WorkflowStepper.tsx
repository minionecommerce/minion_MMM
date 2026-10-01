'use client';

import { workflowSteps, stageToWorkflowIndex } from '../data/mock';
import { Check } from 'lucide-react';

interface WorkflowStepperProps {
  currentStage: string;
}

export default function WorkflowStepper({ currentStage }: WorkflowStepperProps) {
  const currentIdx = stageToWorkflowIndex[currentStage] ?? 0;

  return (
    <div className="py-3">
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-3 h-px bg-[#292B30]" />
        <div
          className="absolute left-0 top-3 h-px bg-yellow-400 transition-all duration-700"
          style={{ width: `${Math.min(100, (currentIdx / (workflowSteps.length - 1)) * 100)}%` }}
        />

        {workflowSteps.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              {/* Dot */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isDone ? 'bg-yellow-400 border-yellow-400' :
                isCurrent ? 'bg-[#0D0D0F] border-yellow-400 ring-2 ring-yellow-400/30' :
                'bg-[#0D0D0F] border-[#292B30]'
              }`}>
                {isDone && <Check className="w-3 h-3 text-black" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
              </div>
              {/* Label */}
              <div className={`mt-2 text-center text-[9px] font-bold tracking-wide uppercase leading-tight max-w-[64px] transition-colors ${
                isCurrent ? 'text-yellow-400' :
                isDone ? 'text-gray-500' :
                'text-gray-700'
              }`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
