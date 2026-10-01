'use client';

import { Plus, Phone, MapPin, CreditCard, User, Building2, FileText } from 'lucide-react';

const actions = [
  { label: 'New Lead', key: 'lead', icon: Plus, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20' },
  { label: 'New Follow-up', key: 'followup', icon: Phone, color: 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20' },
  { label: 'Schedule Site Visit', key: 'sitevisit', icon: MapPin, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20' },
  { label: 'Preliminary Quote', key: 'quote', icon: FileText, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/20' },
  { label: 'Create Deal', key: 'deal', icon: Building2, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20' },
  { label: 'Add Customer', key: 'customer', icon: User, color: 'text-teal-400 bg-teal-400/10 border-teal-400/20 hover:bg-teal-400/20' },
];

interface QuickActionsProps {
  onNewLead?: () => void;
  onNewFollowup?: () => void;
  onScheduleSiteVisit?: () => void;
  onNewQuote?: () => void;
}

export default function QuickActions({ onNewLead, onNewFollowup, onScheduleSiteVisit, onNewQuote }: QuickActionsProps) {
  const handlers: Record<string, (() => void) | undefined> = {
    lead: onNewLead,
    followup: onNewFollowup,
    sitevisit: onScheduleSiteVisit,
    quote: onNewQuote,
  };

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] p-4">
      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={handlers[a.key]}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 ${a.color}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
