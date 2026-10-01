'use client';

import { useState } from 'react';
import { Phone, MessageCircle, ExternalLink, Clock, AlertCircle, Check } from 'lucide-react';
import { FollowUp } from '../data/mock';
import { useMyWork } from "../MyWorkContext";
import { completeFollowUp } from '../actions';

type FollowUpTab = 'Today' | 'Overdue' | 'Upcoming';

const stageColors: Record<string, string> = {
  'New Lead': 'bg-blue-400/10 text-blue-400',
  'Quote Sent': 'bg-yellow-400/10 text-yellow-400',
  'Negotiation': 'bg-orange-400/10 text-orange-400',
  'Won': 'bg-green-400/10 text-green-400',
  'Lost': 'bg-red-400/10 text-red-400',
};

function FollowUpCard({ followup, onComplete }: { followup: FollowUp; onComplete: (id: string) => void }) {
  const initials = followup.customerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
            <span className="text-yellow-400 text-[12px] font-bold">{initials}</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">{followup.customerName}</div>
            {followup.company && (
              <div className="text-[11px] text-gray-500">{followup.company}</div>
            )}
            <div className="text-[11px] text-gray-500">{followup.projectType}</div>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2 ${stageColors[followup.stage] ?? 'bg-gray-400/10 text-gray-400'}`}>
          {followup.stage}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Last Contact</div>
          <div className="text-[12px] text-gray-300 font-medium">{followup.lastContact}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Next Follow-up</div>
          <div className={`text-[12px] font-semibold ${followup.isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
            {followup.nextFollowup} • {followup.nextFollowupTime}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Quote Value</div>
          <div className="text-[14px] font-bold text-white">{followup.quoteValue}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#1e2025]">
        <a
          href={`tel:${followup.phone}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 flex-1 justify-center bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[11px] font-semibold py-2 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          Call
        </a>
        <a
          href={`https://wa.me/${followup.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 flex-1 justify-center bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[11px] font-semibold py-2 rounded-lg border border-[#25D366]/20 hover:border-[#25D366]/40 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            setLoading(true);
            await onComplete(followup.id);
          }}
          disabled={loading}
          className="flex items-center gap-1.5 flex-1 justify-center bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-semibold py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
        >
          {loading ? '...' : <><Check className="w-3.5 h-3.5" /> Done</>}
        </button>
      </div>
    </div>
  );
}

export default function CustomerFollowUps() {
  const { followUps } = useMyWork();

  const [activeTab, setActiveTab] = useState<FollowUpTab>('Today');
  const tabs: FollowUpTab[] = ['Today', 'Overdue', 'Upcoming'];

  const filtered = followUps.filter(f => {
    if (activeTab === 'Today') return f.isToday;
    if (activeTab === 'Overdue') return f.isOverdue;
    return !f.isToday && !f.isOverdue;
  });

  const handleComplete = async (id: string) => {
    try {
      await completeFollowUp(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-bold text-white">Customer Follow-ups</h2>
          <button className="text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
            View All →
          </button>
        </div>
        <p className="text-[12px] text-gray-500 mb-3">Stay on top of your customer conversations.</p>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[#292B30]">
          {tabs.map(tab => {
            const count = followUps.filter(f => {
              if (tab === 'Today') return f.isToday;
              if (tab === 'Overdue') return f.isOverdue;
              return !f.isToday && !f.isOverdue;
            }).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-[11px] font-semibold tracking-wide transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-yellow-400 border-yellow-400'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab}
                {tab === 'Overdue' && count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="p-5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-[13px]">No follow-ups in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(f => <FollowUpCard key={f.id} followup={f} onComplete={handleComplete} />)}
          </div>
        )}
      </div>
    </div>
  );
}
