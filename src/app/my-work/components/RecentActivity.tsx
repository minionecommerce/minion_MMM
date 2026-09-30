'use client';

import { CheckCircle2, RefreshCw, MapPin, Upload, MessageSquare } from 'lucide-react';
import { ActivityItem } from '../data/mock';
import { useMyWork } from "../MyWorkContext";

const iconConfig = {
  check: { icon: CheckCircle2, bg: 'bg-green-500/10', color: 'text-green-400', border: 'border-green-500/20' },
  refresh: { icon: RefreshCw, bg: 'bg-yellow-400/10', color: 'text-yellow-400', border: 'border-yellow-400/20' },
  visit: { icon: MapPin, bg: 'bg-blue-500/10', color: 'text-blue-400', border: 'border-blue-500/20' },
  upload: { icon: Upload, bg: 'bg-purple-500/10', color: 'text-purple-400', border: 'border-purple-500/20' },
  message: { icon: MessageSquare, bg: 'bg-gray-500/10', color: 'text-gray-400', border: 'border-gray-500/20' },
};

export default function RecentActivity() {
  const { activities } = useMyWork();

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#1e2025]">
        <h2 className="text-[14px] font-bold text-white">Recent Activity</h2>
        <p className="text-[12px] text-gray-500 mt-0.5">Your latest actions and updates.</p>
      </div>

      {/* Activity List */}
      <div className="px-5 py-4 space-y-3">
        {activities.map((item, idx) => {
          const config = iconConfig[item.icon];
          const Icon = config.icon;
          const isLast = idx === activities.length - 1;

          return (
            <div key={item.id} className="relative">
              {/* Vertical line connector */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-[#292B30]" />
              )}

              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${config.bg} ${config.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 pb-3">
                  <div className="text-[12px] font-semibold text-white">{item.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{item.subtitle}</div>
                  <div className="text-[10px] text-gray-700 mt-1">{item.time}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
