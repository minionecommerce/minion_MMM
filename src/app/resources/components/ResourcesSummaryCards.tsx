'use client';

import { FileText, LayoutTemplate, ShieldCheck, Clock, Bookmark, Database } from 'lucide-react';
import { mockSummary } from '../data/mock';

export default function ResourcesSummaryCards() {
  const cards = [
    { title: 'TOTAL RESOURCES', value: mockSummary.totalResources, icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { title: 'DOCUMENTS', value: mockSummary.documents, icon: FileText, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    { title: 'TEMPLATES', value: mockSummary.templates, icon: LayoutTemplate, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
    { title: 'SOPs & POLICIES', value: mockSummary.sopsAndPolicies, icon: ShieldCheck, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    { title: 'RECENTLY ADDED', value: mockSummary.recentlyAdded, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
    { title: 'MY SAVED', value: mockSummary.mySaved, icon: Bookmark, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' }
  ];

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-wider leading-tight max-w-[70%] transition-colors">{card.title}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-[20px] font-black text-white leading-none truncate">
                {card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
