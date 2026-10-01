'use client';

import { Plus, Download } from 'lucide-react';

interface CRMHeaderProps {
  onNewLead: () => void;
  onNewFollowup: () => void;
  onNewQuote?: () => void;
  onImport?: () => void;
}

export default function CRMHeader({ onNewLead, onNewFollowup, onNewQuote, onImport }: CRMHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-widest text-yellow-400 uppercase">CRM</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Customer Relationship Management</h1>
          <p className="text-[13px] text-gray-400 mt-1 max-w-xl">
            Manage leads, customers, quotes, follow-ups and deals — from enquiry to project.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="crm-new-lead-btn"
            onClick={onNewLead}
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold px-3.5 py-2 rounded-lg transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Lead
          </button>
          <button
            id="crm-new-followup-btn"
            onClick={onNewFollowup}
            className="flex items-center gap-1.5 bg-[#1a1b1e] hover:bg-[#222326] border border-[#292B30] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Follow-up
          </button>
          <button
            id="crm-new-quote-btn"
            onClick={onNewQuote}
            className="flex items-center gap-1.5 bg-[#1a1b1e] hover:bg-[#222326] border border-[#292B30] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quote
          </button>
          <button
            id="crm-import-btn"
            onClick={onImport}
            className="flex items-center gap-1.5 bg-[#1a1b1e] hover:bg-[#222326] border border-[#292B30] text-gray-400 hover:text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
