'use client';

import { ShoppingCart, FileText, Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { useMyWork } from "../MyWorkContext";

const typeIcons = {
  purchase: ShoppingCart,
  boq: FileText,
  leave: Calendar,
  approval: FileText,
};

const urgencyConfig = {
  high: { dot: 'bg-red-500', border: 'border-red-500/20 hover:border-red-500/40' },
  medium: { dot: 'bg-yellow-400', border: 'border-yellow-400/20 hover:border-yellow-400/40' },
  low: { dot: 'bg-gray-500', border: 'border-gray-500/20 hover:border-gray-500/40' },
};

export default function ActionRequired() {
  const { actions } = useMyWork();

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#1e2025]">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <span className="text-[14px] font-bold text-white">Action Required</span>
        </div>
        <p className="text-[12px] text-gray-500 pl-6">Things waiting for your decision.</p>
      </div>

      {/* Action Items */}
      <div className="p-5 space-y-2.5">
        {actions.map(action => {
          const Icon = typeIcons[action.type];
          const urgency = urgencyConfig[action.urgency];

          return (
            <div
              key={action.id}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-[#151619] cursor-pointer transition-all ${urgency.border}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgency.dot}`} />
                  <span className="text-[13px] font-semibold text-white truncate">{action.title}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 pl-3.5">{action.subtitle}</div>
              </div>

              <div className="text-right shrink-0">
                {action.amount && (
                  <div className="text-[13px] font-bold text-white">{action.amount}</div>
                )}
                {action.date && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 justify-end">
                    <Clock className="w-3 h-3" />
                    {action.date}
                  </div>
                )}
                <button className="flex items-center gap-0.5 text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors mt-1">
                  Review <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
