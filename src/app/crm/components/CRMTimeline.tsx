'use client';

import { TimelineEvent } from '../data/mock';
import { Phone, MessageCircle, Mail, CalendarCheck, FileText, MapPin, StickyNote, ArrowRight, Users, Plus, CheckCircle2 } from 'lucide-react';

const iconMap = {
  created: { icon: Plus, bg: 'bg-yellow-400/10 border-yellow-400/20', color: 'text-yellow-400' },
  call: { icon: Phone, bg: 'bg-green-500/10 border-green-500/20', color: 'text-green-400' },
  whatsapp: { icon: MessageCircle, bg: 'bg-[#25D366]/10 border-[#25D366]/20', color: 'text-[#25D366]' },
  email: { icon: Mail, bg: 'bg-blue-500/10 border-blue-500/20', color: 'text-blue-400' },
  followup: { icon: CalendarCheck, bg: 'bg-orange-500/10 border-orange-500/20', color: 'text-orange-400' },
  quote: { icon: FileText, bg: 'bg-purple-500/10 border-purple-500/20', color: 'text-purple-400' },
  site_visit: { icon: MapPin, bg: 'bg-cyan-500/10 border-cyan-500/20', color: 'text-cyan-400' },
  note: { icon: StickyNote, bg: 'bg-gray-500/10 border-gray-500/20', color: 'text-gray-400' },
  stage_change: { icon: ArrowRight, bg: 'bg-pink-500/10 border-pink-500/20', color: 'text-pink-400' },
  deal: { icon: CheckCircle2, bg: 'bg-green-500/10 border-green-500/20', color: 'text-green-400' },
  assignment: { icon: Users, bg: 'bg-indigo-500/10 border-indigo-500/20', color: 'text-indigo-400' },
};

interface CRMTimelineProps {
  events: TimelineEvent[];
}

export default function CRMTimeline({ events }: CRMTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const config = iconMap[event.type] ?? iconMap.note;
        const Icon = config.icon;
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="relative flex items-start gap-3 pb-4">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-[#292B30]" />
            )}

            {/* Icon */}
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 ${config.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[13px] font-semibold text-white">{event.title}</span>
                  {event.description && (
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{event.description}</p>
                  )}
                  {event.amount && (
                    <span className="inline-flex text-[11px] font-bold text-yellow-400 mt-1">₹{event.amount.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-gray-600">{event.date}</div>
                  <div className="text-[10px] text-gray-700">{event.time}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">by {event.by}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
