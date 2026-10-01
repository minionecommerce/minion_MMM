'use client';

import { ActivityHistory } from '../../data/mock';
import { Clock, Calendar, MessageSquare, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface ProjectTimelineProps {
  timeline: ActivityHistory[];
}

export default function ProjectTimeline({ timeline }: ProjectTimelineProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[18px] font-black text-white">PROJECT TIMELINE</h2>
      </div>

      <div className="relative pl-6">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#292B30]" />

        <div className="space-y-8">
          {timeline.map((event, idx) => {
            const isLatest = idx === 0;
            
            // Icon mapping based on text
            let Icon = Calendar;
            let iconColor = 'text-gray-400';
            let bgColor = 'bg-[#151619]';

            if (event.description.includes('completed') || event.description.includes('approved')) {
              Icon = CheckCircle2;
              iconColor = 'text-green-400';
              bgColor = 'bg-green-400/10 border-green-400/20';
            } else if (event.description.includes('issue') || event.description.includes('delayed')) {
              Icon = AlertCircle;
              iconColor = 'text-red-400';
              bgColor = 'bg-red-400/10 border-red-400/20';
            } else if (event.description.includes('document') || event.description.includes('BOQ')) {
              Icon = FileText;
              iconColor = 'text-blue-400';
              bgColor = 'bg-blue-400/10 border-blue-400/20';
            } else if (event.description.includes('comment') || event.description.includes('update')) {
              Icon = MessageSquare;
              iconColor = 'text-yellow-400';
              bgColor = 'bg-yellow-400/10 border-yellow-400/20';
            }

            return (
              <div key={event.id} className="relative">
                {/* Connector Dot */}
                <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center -ml-[5px] bg-[#0D0D0F] ${
                  isLatest ? 'border-yellow-400 shadow-[0_0_10px_rgba(255,196,0,0.3)]' : 'border-[#292B30]'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-yellow-400' : 'bg-[#292B30]'}`} />
                </div>

                <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 ml-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bgColor}`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-white">{event.action}</div>
                        <div className="text-[11px] text-gray-500 font-semibold">{event.user}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="ml-10 text-[13px] text-gray-300">
                    {event.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
