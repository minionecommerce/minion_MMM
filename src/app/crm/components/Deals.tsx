'use client';

import { useState, useTransition } from 'react';
import { ChevronRight, TrendingUp, Trophy, XCircle, Handshake, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateDealStage, convertDealToProject } from '@/app/actions/crm';

interface DealsProps {
  deals: any[];
  employees: any[];
  onRefresh: () => void;
}

const stageConfig: Record<string, { class: string; icon: any }> = {
  'Qualification': { class: 'bg-blue-400/10 text-blue-400', icon: TrendingUp },
  'Requirements': { class: 'bg-indigo-400/10 text-indigo-400', icon: TrendingUp },
  'Preliminary Quote': { class: 'bg-yellow-400/10 text-yellow-400', icon: TrendingUp },
  'Site Visit': { class: 'bg-purple-400/10 text-purple-400', icon: TrendingUp },
  'Final Quote': { class: 'bg-amber-400/10 text-amber-400', icon: TrendingUp },
  'Negotiation': { class: 'bg-pink-400/10 text-pink-400', icon: Handshake },
  'Won': { class: 'bg-green-400/10 text-green-400', icon: Trophy },
  'Lost': { class: 'bg-red-400/10 text-red-400', icon: XCircle },
};

function formatValue(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function DealCard({ deal, employees, onRefresh }: { deal: any; employees: any[]; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showConvert, setShowConvert] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [convertError, setConvertError] = useState<string | null>(null);

  const sc = stageConfig[deal.stage] || stageConfig['Qualification'];
  const Icon = sc.icon;
  const customerName = deal.customer?.name || 'Unknown';
  const initials = customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const salesExecName = deal.salesExecutive?.user?.name || 'Unassigned';
  const linkedProject = deal.projects?.[0];
  const dealValue = Number(deal.value || 0);

  const handleMarkWon = () => {
    startTransition(async () => {
      try {
        await updateDealStage(deal.id, 'Won', { probability: 100 });
        onRefresh();
      } catch {}
    });
  };

  const handleConvert = () => {
    if (!projectName.trim() || !managerId) {
      setConvertError('Project name and manager are required.');
      return;
    }
    setConvertError(null);
    startTransition(async () => {
      try {
        const result = await convertDealToProject(deal.id, {
          name: projectName.trim(),
          managerId,
        });
        if (result.success) {
          setShowConvert(false);
          onRefresh();
        }
      } catch (err: any) {
        setConvertError(err.message || 'Failed to convert deal');
      }
    });
  };

  const closeDate = deal.expectedCloseDate
    ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'TBD';

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
            <span className="text-yellow-400 text-[11px] font-bold">{initials}</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">{deal.title}</div>
            <div className="text-[11px] text-gray-500">{customerName}</div>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${sc.class}`}>
          <Icon className="w-3 h-3" />
          {deal.stage}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
        <div>
          <div className="text-gray-600 mb-0.5">Deal ID</div>
          <div className="text-yellow-400 font-mono font-semibold">{deal.dealNumber || deal.id.slice(0, 8)}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Deal Value</div>
          <div className="text-white font-bold">{formatValue(dealValue)}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Sales Exec</div>
          <div className="text-gray-300 font-semibold">{salesExecName}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Expected Close</div>
          <div className="text-gray-300 font-semibold">{closeDate}</div>
        </div>
        {deal.quotes?.[0] && (
          <div className="col-span-2">
            <div className="text-gray-600 mb-0.5">Linked Quote</div>
            <div className="text-blue-400 font-mono font-semibold">{deal.quotes[0].quoteNumber || deal.quotes[0].id.slice(0, 8)}</div>
          </div>
        )}
        {deal.probability != null && (
          <div className="col-span-2">
            <div className="text-gray-600 mb-1">Win Probability: {deal.probability}%</div>
            <div className="w-full bg-[#1a1b1e] rounded-full h-1 overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${deal.probability}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Convert to Project form */}
      {showConvert && (
        <div className="mb-3 space-y-2 bg-[#0a0a0c] rounded-lg p-3 border border-[#292B30]">
          <div className="text-[11px] font-bold text-green-400 mb-2">Convert Deal to Project</div>
          {convertError && (
            <div className="flex items-center gap-1 text-[11px] text-red-400">
              <AlertCircle className="w-3 h-3" /> {convertError}
            </div>
          )}
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Project name..."
            className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder-gray-700 focus:outline-none focus:border-green-400/50"
          />
          <select
            value={managerId}
            onChange={e => setManagerId(e.target.value)}
            className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-green-400/50"
          >
            <option value="">Select Project Manager...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name || 'Unknown'}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setShowConvert(false); setConvertError(null); }} className="px-3 py-1.5 bg-[#151619] border border-[#292B30] text-gray-400 rounded-lg text-[11px] transition">Cancel</button>
            <button onClick={handleConvert} disabled={isPending} className="flex-1 py-1.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-1 disabled:opacity-50">
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-[#1e2025]">
        {deal.status === 'Won' && !linkedProject && !showConvert ? (
          <button
            onClick={() => setShowConvert(true)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-400 text-white text-[11px] font-bold py-2 rounded-lg transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" /> Convert to Project
          </button>
        ) : deal.status === 'Won' && linkedProject ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-semibold py-2 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" /> Project: {linkedProject.name}
          </div>
        ) : deal.status !== 'Lost' && deal.status !== 'Won' ? (
          <button
            onClick={handleMarkWon}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 text-yellow-400 text-[11px] font-bold py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Mark Won
          </button>
        ) : null}
        <button className="px-3 py-2 bg-[#151619] border border-[#292B30] hover:border-gray-500 text-gray-400 hover:text-white text-[11px] font-semibold rounded-lg transition-all">
          View
        </button>
      </div>
    </div>
  );
}

export default function Deals({ deals, employees, onRefresh }: DealsProps) {
  const totalPipeline = deals.filter(d => !['Won', 'Lost', 'Cancelled'].includes(d.status)).reduce((sum, d) => sum + Number(d.value || 0), 0);
  const wonCount = deals.filter(d => d.status === 'Won').length;
  const negotiationCount = deals.filter(d => d.stage === 'Negotiation').length;

  function formatValue(val: number) {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-pink-400/5 border border-pink-400/20 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{negotiationCount}</div>
          <div className="text-[10px] text-pink-400 uppercase tracking-wider font-bold">Negotiation</div>
        </div>
        <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{wonCount}</div>
          <div className="text-[10px] text-green-400 uppercase tracking-wider font-bold">Won</div>
        </div>
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{formatValue(totalPipeline)}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Pipeline</div>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-3xl mb-2">🤝</div>
          <div className="text-[13px] font-semibold">No deals found</div>
          <div className="text-[11px] mt-1">Convert a lead to a deal to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deals.map(d => <DealCard key={d.id} deal={d} employees={employees} onRefresh={onRefresh} />)}
        </div>
      )}
    </div>
  );
}
