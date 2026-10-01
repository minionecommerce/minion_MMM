'use client';

import { ArrowRight, Zap, Phone, ShoppingBag } from 'lucide-react';

interface FocusItem {
  index: number;
  title: string;
  tag: string;
  tagColor: string;
  timeLabel: string;
  icon: React.ReactNode;
}

const focusItems: FocusItem[] = [
  {
    index: 1,
    title: 'Finalize Kumar Residence BOQ',
    tag: 'HIGH PRIORITY',
    tagColor: 'text-red-400 bg-red-500/10 border border-red-500/20',
    timeLabel: 'Due in 1h 20m',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  {
    index: 2,
    title: 'Follow up with Rajesh Kumar',
    tag: 'CUSTOMER FOLLOW-UP',
    tagColor: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
    timeLabel: 'Due today',
    icon: <Phone className="w-3.5 h-3.5" />,
  },
  {
    index: 3,
    title: 'Approve material requirement',
    tag: 'PROJECT PROCUREMENT',
    tagColor: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
    timeLabel: 'Due today',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
];

export default function FocusToday() {
  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1e2025]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase">Focus Today</span>
        </div>
        <p className="text-[12px] text-gray-500 pl-3.5">3 items need your attention</p>
      </div>

      {/* Focus Items */}
      <div className="p-5 space-y-3">
        {focusItems.map((item) => (
          <div
            key={item.index}
            className="flex items-start gap-3 p-3 rounded-lg border border-[#1e2025] hover:border-yellow-400/20 hover:bg-yellow-400/5 transition-all cursor-pointer group"
          >
            {/* Number */}
            <div className="w-7 h-7 rounded-full bg-[#1a1b1e] border border-[#292B30] flex items-center justify-center shrink-0 group-hover:border-yellow-400/30 transition-colors">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-yellow-400 transition-colors">
                {String(item.index).padStart(2, '0')}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-snug group-hover:text-yellow-50 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${item.tagColor}`}>
                  {item.icon}
                  {item.tag}
                </span>
                <span className="text-[11px] text-gray-600">{item.timeLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <button className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold py-2.5 rounded-lg transition-all duration-200 active:scale-95">
          View All Priorities
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
