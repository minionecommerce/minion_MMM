'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Phone, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import { updateLeadStage } from '@/app/actions/crm';

const LEAD_STAGES = [
  'New', 'Contacted', 'Requirements Collected', 'Preliminary Quote Sent',
  'Follow-up', 'Site Visit Scheduled', 'Site Visit Completed',
  'Final Quote Sent', 'Negotiation', 'Won', 'Lost', 'On Hold',
];

const stageColors: Record<string, string> = {
  'New': 'bg-blue-400/10 text-blue-400',
  'Contacted': 'bg-cyan-400/10 text-cyan-400',
  'Requirements Collected': 'bg-indigo-400/10 text-indigo-400',
  'Preliminary Quote Sent': 'bg-yellow-400/10 text-yellow-400',
  'Follow-up': 'bg-orange-400/10 text-orange-400',
  'Site Visit Scheduled': 'bg-purple-400/10 text-purple-400',
  'Site Visit Completed': 'bg-purple-400/10 text-purple-400',
  'Final Quote Sent': 'bg-amber-400/10 text-amber-400',
  'Negotiation': 'bg-pink-400/10 text-pink-400',
  'Won': 'bg-green-400/10 text-green-400',
  'Lost': 'bg-red-400/10 text-red-400',
  'On Hold': 'bg-gray-400/10 text-gray-400',
};

interface LeadTableProps {
  leads: any[];
  onLeadClick: (lead: any) => void;
  onRefresh: () => void;
}

function CustomerInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
      <span className="text-yellow-400 text-[10px] font-bold">{initials}</span>
    </div>
  );
}

function StageDropdown({ lead, onRefresh }: { lead: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (stage: string) => {
    setOpen(false);
    startTransition(async () => {
      try {
        await updateLeadStage(lead.id, stage);
        onRefresh();
      } catch {}
    });
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap transition-all ${stageColors[lead.stage] ?? 'bg-gray-400/10 text-gray-400'}`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : lead.stage}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden shadow-xl min-w-[200px]">
            {LEAD_STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleChange(stage)}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold hover:bg-yellow-400/10 transition-colors flex items-center gap-2 ${
                  stage === lead.stage ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${stageColors[stage]?.split(' ')[0]}`} />
                {stage}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LeadTable({ leads, onLeadClick, onRefresh }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-[14px] font-semibold">No leads found</div>
        <div className="text-[12px] mt-1">Try adjusting your search or filters</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-b border-[#292B30]">
            {['Lead ID', 'Customer', 'Contact', 'Location', 'Requirement', 'Budget', 'Sales Exec', 'Stage', 'Last Contact', 'Priority', ''].map(col => (
              <th key={col} className="text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap first:pl-0 last:pr-0">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2025]">
          {leads.map(lead => (
            <tr
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors"
            >
              {/* Lead ID */}
              <td className="px-3 py-3 first:pl-0">
                <span className="text-[11px] font-mono text-yellow-400/80 hover:text-yellow-400">
                  {lead.leadNumber || lead.id.slice(0, 8)}
                </span>
              </td>

              {/* Customer */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <CustomerInitials name={lead.customerName} />
                  <div>
                    <div className="text-[13px] font-semibold text-white leading-tight">{lead.customerName}</div>
                    <div className="text-[11px] text-gray-600">{lead.customerType}</div>
                  </div>
                </div>
              </td>

              {/* Contact */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-gray-400">{lead.phone}</span>
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-all"
                  >
                    <Phone className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://wa.me/${(lead.whatsapp || lead.phone).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </a>
                </div>
              </td>

              {/* Location */}
              <td className="px-3 py-3">
                <span className="text-[12px] text-gray-400 whitespace-nowrap">{lead.siteLocation}</span>
              </td>

              {/* Requirement */}
              <td className="px-3 py-3 max-w-[150px]">
                <span className="text-[12px] text-gray-300 line-clamp-1">{lead.requirement}</span>
              </td>

              {/* Budget */}
              <td className="px-3 py-3">
                <span className="text-[12px] font-semibold text-white whitespace-nowrap">{lead.budgetRange}</span>
              </td>

              {/* Sales Exec */}
              <td className="px-3 py-3">
                <span className="text-[12px] text-gray-300">{lead.salesExecutive}</span>
              </td>

              {/* Stage */}
              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                <StageDropdown lead={lead} onRefresh={onRefresh} />
              </td>

              {/* Last Contact */}
              <td className="px-3 py-3">
                <span className="text-[11px] text-gray-500 whitespace-nowrap">{lead.lastContact}</span>
              </td>

              {/* Priority */}
              <td className="px-3 py-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  lead.priority === 'High' ? 'bg-red-400/10 text-red-400' :
                  lead.priority === 'Medium' ? 'bg-yellow-400/10 text-yellow-400' :
                  'bg-gray-400/10 text-gray-400'
                }`}>
                  {lead.priority}
                </span>
              </td>

              {/* Action */}
              <td className="px-3 py-3 last:pr-0">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); onLeadClick(lead); }}
                    className="flex items-center gap-0.5 text-[11px] text-yellow-400 hover:text-yellow-300 font-semibold"
                  >
                    Open <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
