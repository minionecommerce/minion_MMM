'use client';

import { BookOpen, CheckCircle2, Clock, Users, Award, TrendingUp } from 'lucide-react';

const cards = [
  {
    title: 'MY LEARNING',
    value: '08',
    sub1: '03 In Progress',
    sub2: '02 Due Soon',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20'
  },
  {
    title: 'COMPLETION',
    value: '78%',
    sub1: 'This Month',
    sub2: '',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20'
  },
  {
    title: 'LEARNING HOURS',
    value: '18.5',
    sub1: 'This Month',
    sub2: '',
    icon: Clock,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20'
  },
  {
    title: 'SESSIONS',
    value: '12',
    sub1: '08 Attended',
    sub2: '',
    icon: Users,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/20'
  },
  {
    title: 'CERTIFICATIONS',
    value: '04',
    sub1: '02 New',
    sub2: '',
    icon: Award,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20'
  },
  {
    title: 'SKILL PROGRESS',
    value: '91%',
    sub1: 'Average',
    sub2: '',
    icon: TrendingUp,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10 border-pink-400/20'
  }
];

export default function LearningSummaryCards() {
  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight w-2/3">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1 mb-2">
                  <div className="text-[22px] font-black text-white leading-none">{card.value}</div>
                  {card.title === 'LEARNING HOURS' && <span className="text-[10px] font-bold text-gray-500 uppercase">hrs</span>}
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[10px] font-semibold ${card.sub1.includes('Due Soon') ? 'text-amber-400' : 'text-gray-400'}`}>{card.sub1}</span>
                  {card.sub2 && (
                    <span className={`text-[10px] font-semibold ${card.sub2.includes('Due Soon') ? 'text-amber-400' : 'text-gray-400'}`}>{card.sub2}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
