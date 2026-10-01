'use client';

import { useState, useTransition } from 'react';
import { Phone, MessageCircle, CheckCircle2, RefreshCw, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { completeFollowUp, rescheduleFollowUp } from '@/app/actions/crm';

type FollowUpTab = 'Today' | 'Overdue' | 'Upcoming' | 'Completed' | 'All';

interface FollowUpsProps {
  followUps: any[];
  onRefresh: () => void;
}

const statusConfig = {
  'Pending': { class: 'bg-blue-400/10 text-blue-400', icon: Clock, label: 'Pending' },
  'Completed': { class: 'bg-green-400/10 text-green-400', icon: CheckCircle2, label: 'Completed' },
  'Cancelled': { class: 'bg-gray-400/10 text-gray-400', icon: RefreshCw, label: 'Cancelled' },
  'Rescheduled': { class: 'bg-orange-400/10 text-orange-400', icon: RefreshCw, label: 'Rescheduled' },
};

function getFollowUpUrgency(fu: any): 'Overdue' | 'Due Today' | 'Upcoming' | 'Completed' {
  if (fu.status === 'Completed') return 'Completed';
  const now = new Date();
  const date = new Date(fu.scheduledDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fuDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (fuDate < today) return 'Overdue';
  if (fuDate.getTime() === today.getTime()) return 'Due Today';
  return 'Upcoming';
}

function FollowUpCard({ fu, onRefresh }: { fu: any; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [completing, setCompleting] = useState(false);
  const urgency = getFollowUpUrgency(fu);
  const customerName = fu.customer?.name || 'Unknown';
  const initials = customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const phone = fu.customer?.phone || '';
  const dateStr = fu.scheduledDate ? new Date(fu.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';
  const timeStr = fu.scheduledDate ? new Date(fu.scheduledDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const assigneeName = fu.assignedTo?.user?.name || 'Unassigned';

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeFollowUp(fu.id, 'Marked complete from CRM');
        onRefresh();
      } catch {}
    });
  };

  const urgencyConfig = {
    'Overdue': { class: 'bg-red-400/10 text-red-400', icon: AlertTriangle },
    'Due Today': { class: 'bg-yellow-400/10 text-yellow-400', icon: Clock },
    'Upcoming': { class: 'bg-blue-400/10 text-blue-400', icon: Clock },
    'Completed': { class: 'bg-green-400/10 text-green-400', icon: CheckCircle2 },
  };
  const uc = urgencyConfig[urgency];
  const UIcon = uc.icon;

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
            <span className="text-yellow-400 text-[11px] font-bold">{initials}</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">{customerName}</div>
            <div className="text-[11px] font-mono text-gray-600">{fu.lead?.leadNumber || fu.followUpNumber || fu.id.slice(0, 8)}</div>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${uc.class}`}>
          <UIcon className="w-3 h-3" />
          {urgency}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
        <div>
          <div className="text-gray-600 mb-0.5">Scheduled</div>
          <div className={`font-semibold ${urgency === 'Overdue' ? 'text-red-400' : 'text-yellow-400'}`}>
            {dateStr} {timeStr && `• ${timeStr}`}
          </div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Assigned To</div>
          <div className="font-semibold text-white">{assigneeName}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Type</div>
          <div className="font-semibold text-gray-300">{fu.type || 'Call'}</div>
        </div>
        {fu.purpose && (
          <div className="col-span-2">
            <div className="text-gray-600 mb-0.5">Purpose</div>
            <div className="text-gray-300">{fu.purpose}</div>
          </div>
        )}
      </div>

      {fu.status !== 'Completed' && (
        <div className="flex items-center gap-2 pt-3 border-t border-[#1e2025]">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 flex-1 justify-center bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[11px] font-semibold py-1.5 rounded-lg transition-all">
              <Phone className="w-3 h-3" /> Call
            </a>
          )}
          {phone && (
            <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 flex-1 justify-center bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] text-[11px] font-semibold py-1.5 rounded-lg transition-all">
              <MessageCircle className="w-3 h-3" /> WA
            </a>
          )}
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex items-center gap-1 flex-1 justify-center bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 text-yellow-400 text-[11px] font-semibold py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Done
          </button>
        </div>
      )}

      {fu.status === 'Completed' && fu.completedAt && (
        <div className="pt-3 border-t border-[#1e2025] text-[11px] text-green-400">
          ✓ Completed {new Date(fu.completedAt).toLocaleDateString('en-IN')}
          {fu.completionNotes && <div className="text-gray-500 mt-1">{fu.completionNotes}</div>}
        </div>
      )}
    </div>
  );
}

export default function FollowUps({ followUps, onRefresh }: FollowUpsProps) {
  const [activeTab, setActiveTab] = useState<FollowUpTab>('Today');
  const tabs: FollowUpTab[] = ['Today', 'Overdue', 'Upcoming', 'Completed', 'All'];

  const categorized = followUps.map(fu => ({ ...fu, urgency: getFollowUpUrgency(fu) }));

  const countMap = {
    Today: categorized.filter(f => f.urgency === 'Due Today').length,
    Overdue: categorized.filter(f => f.urgency === 'Overdue').length,
    Upcoming: categorized.filter(f => f.urgency === 'Upcoming').length,
    Completed: categorized.filter(f => f.urgency === 'Completed').length,
    All: followUps.length,
  };

  const filtered = categorized.filter(f => {
    if (activeTab === 'Today') return f.urgency === 'Due Today';
    if (activeTab === 'Overdue') return f.urgency === 'Overdue';
    if (activeTab === 'Upcoming') return f.urgency === 'Upcoming';
    if (activeTab === 'Completed') return f.urgency === 'Completed';
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-0 border-b border-[#292B30] mb-5">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[11px] font-semibold tracking-wide border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
              activeTab === tab ? 'text-yellow-400 border-yellow-400' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab}
            {countMap[tab] > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                tab === 'Overdue' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'
              }`}>
                {countMap[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-3xl mb-2">📞</div>
          <div className="text-[13px] font-semibold">No {activeTab.toLowerCase()} follow-ups</div>
          <div className="text-[11px] mt-1">Follow-ups will appear here once created</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(f => <FollowUpCard key={f.id} fu={f} onRefresh={onRefresh} />)}
        </div>
      )}
    </div>
  );
}
