'use client';

import { ScheduleEvent } from '../data/mock';
import { useMyWork } from "../MyWorkContext";
import { Building2, FolderOpen, Coffee, Phone, BookOpen, Monitor } from 'lucide-react';

const typeConfig = {
  company: { icon: Building2, color: 'text-blue-400' },
  project: { icon: FolderOpen, color: 'text-yellow-400' },
  break: { icon: Coffee, color: 'text-gray-500' },
  crm: { icon: Phone, color: 'text-green-400' },
  learning: { icon: BookOpen, color: 'text-purple-400' },
};

function DotIndicator({ status }: { status: ScheduleEvent['status'] }) {
  if (status === 'completed') {
    return <div className="w-2.5 h-2.5 rounded-full bg-gray-600 shrink-0" />;
  }
  if (status === 'current') {
    return (
      <div className="relative w-2.5 h-2.5 shrink-0">
        <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75" />
        <div className="relative w-2.5 h-2.5 rounded-full bg-yellow-400" />
      </div>
    );
  }
  return <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-600 shrink-0" />;
}

export default function TodaysSchedule() {
  const { schedule } = useMyWork();

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#1e2025]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Today&apos;s Schedule</span>
        </div>
        <p className="text-[12px] text-gray-500 pl-3.5">Tuesday, 29 September 2026</p>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4 relative">
        {/* Vertical line */}
        <div className="absolute left-[26px] top-6 bottom-6 w-px bg-[#292B30]" />

        <div className="space-y-4">
          {schedule.map((event, idx) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;
            const isCompleted = event.status === 'completed';
            const isCurrent = event.status === 'current';

            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 transition-opacity ${isCompleted ? 'opacity-50' : 'opacity-100'}`}
              >
                {/* Dot */}
                <div className="flex flex-col items-center pt-0.5">
                  <DotIndicator status={event.status} />
                </div>

                {/* Content */}
                <div className={`flex-1 p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-yellow-400/5 border-yellow-400/20'
                    : 'bg-transparent border-transparent hover:bg-white/2 hover:border-white/5'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`text-[12px] font-semibold ${isCurrent ? 'text-yellow-50' : 'text-white'}`}>
                        {event.title}
                      </div>
                      {event.location && (
                        <div className="text-[11px] text-gray-600 mt-0.5">{event.location}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[12px] font-bold ${isCurrent ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {event.time}
                      </div>
                      <div className={`mt-0.5 ${config.color}`}>
                        <Icon className="w-3.5 h-3.5 ml-auto" />
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="mt-1.5">
                      <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Now
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
