'use client';

import { useState, useTransition } from 'react';
import { MapPin, Clock, User, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { completeSiteVisit } from '@/app/actions/crm';

interface SiteVisitsProps {
  siteVisits: any[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { class: string; label: string }> = {
  Scheduled: { class: 'bg-blue-400/10 text-blue-400', label: 'Scheduled' },
  Confirmed: { class: 'bg-yellow-400/10 text-yellow-400', label: 'Confirmed' },
  Completed: { class: 'bg-green-400/10 text-green-400', label: 'Completed' },
  Rescheduled: { class: 'bg-orange-400/10 text-orange-400', label: 'Rescheduled' },
  Cancelled: { class: 'bg-red-400/10 text-red-400', label: 'Cancelled' },
  'No Show': { class: 'bg-gray-400/10 text-gray-400', label: 'No Show' },
};

function SiteVisitCard({ sv, onRefresh }: { sv: any; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showComplete, setShowComplete] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');

  const sc = statusConfig[sv.status] || statusConfig['Scheduled'];
  const customerName = sv.lead?.customer?.name || 'Unknown';
  const initials = customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const dateStr = sv.visitDate ? new Date(sv.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';
  const timeStr = sv.visitDate ? new Date(sv.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const assigneeName = sv.employee?.user?.name || sv.assignedTo || 'Unassigned';
  const location = sv.siteLocation || sv.lead?.customer?.address || 'N/A';

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeSiteVisit(sv.id, {
          visitNotes: visitNotes.trim() || 'Site visit completed',
          nextAction: 'Create Preliminary Quote',
        });
        setShowComplete(false);
        onRefresh();
      } catch {}
    });
  };

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] font-mono text-yellow-400/70 mb-1">{sv.visitNumber || sv.id.slice(0, 8)}</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 text-[10px] font-bold">{initials}</span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">{customerName}</div>
              <div className="text-[11px] font-mono text-gray-600">{sv.lead?.leadNumber || ''}</div>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${sc.class}`}>
          {sc.label}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-[12px] text-gray-400">
          <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          {location}
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          <span className={`font-semibold ${sv.status === 'Confirmed' ? 'text-yellow-400' : 'text-gray-300'}`}>
            {dateStr} {timeStr && `• ${timeStr}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-gray-400">
          <User className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          {assigneeName}
          {sv.visitType && <span className="text-gray-600">· {sv.visitType}</span>}
        </div>
        {sv.notes && (
          <div className="text-[11px] text-gray-600 italic mt-1 bg-[#151619] rounded-lg p-2">{sv.notes}</div>
        )}
      </div>

      {showComplete && (
        <div className="mb-3 space-y-2">
          <textarea
            rows={2}
            value={visitNotes}
            onChange={e => setVisitNotes(e.target.value)}
            placeholder="Visit notes, requirements..."
            className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-3 py-2 text-[12px] text-white placeholder-gray-700 focus:outline-none focus:border-green-400/50 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowComplete(false)} className="px-3 py-1.5 bg-[#151619] border border-[#292B30] text-gray-400 rounded-lg text-[11px] transition">Cancel</button>
            <button onClick={handleComplete} disabled={isPending} className="flex-1 py-1.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-1 disabled:opacity-50">
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Confirm Complete
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#1e2025]">
        <button className="text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors">
          Open <ChevronRight className="w-3 h-3" />
        </button>
        {sv.status !== 'Completed' && sv.status !== 'Cancelled' && !showComplete && (
          <button
            onClick={() => setShowComplete(true)}
            className="text-[11px] font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            Mark Complete
          </button>
        )}
        {sv.status === 'Completed' && (
          <span className="text-[11px] text-green-400 font-semibold">
            ✓ {sv.completedAt ? new Date(sv.completedAt).toLocaleDateString('en-IN') : 'Done'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SiteVisits({ siteVisits, onRefresh }: SiteVisitsProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const statuses = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled'];

  const filtered = statusFilter === 'All' ? siteVisits : siteVisits.filter(sv => sv.status === statusFilter);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                : 'bg-[#0D0D0F] border-[#292B30] text-gray-500 hover:border-gray-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-3xl mb-2">🗺️</div>
          <div className="text-[13px] font-semibold">No site visits found</div>
          <div className="text-[11px] mt-1">Schedule a site visit from a lead</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(sv => <SiteVisitCard key={sv.id} sv={sv} onRefresh={onRefresh} />)}
        </div>
      )}
    </div>
  );
}
