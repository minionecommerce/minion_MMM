'use client';

import { SiteInspection } from '../../data/mock';
import { ClipboardCheck, Plus, Camera, Eye, FileText, ChevronRight } from 'lucide-react';

interface SiteInspectionsProps {
  inspections: SiteInspection[];
}

export default function SiteInspections({ inspections }: SiteInspectionsProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-400/10 border border-pink-400/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">SITE INSPECTIONS</h2>
            <div className="text-[12px] font-semibold text-gray-400 mt-1">Manage and review site audits</div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-400 text-black text-[12px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(236,72,153,0.2)]">
          <Plus className="w-4 h-4" /> New Inspection
        </button>
      </div>

      {/* Grid of Inspections */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {inspections.map(ins => (
          <div key={ins.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-pink-400/30 transition-colors flex flex-col">
            <div className="flex items-start justify-between mb-4 border-b border-[#292B30] pb-4">
              <div>
                <div className="text-[14px] font-bold text-white mb-1">{ins.purpose}</div>
                <div className="text-[11px] font-mono text-pink-400">{ins.id}</div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                ins.status === 'Completed' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
              }`}>
                {ins.status}
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Date</span>
                <span className="text-[12px] font-bold text-white">{new Date(ins.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Inspector</span>
                <span className="text-[12px] font-bold text-white">{ins.inspector}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Health Score</span>
                <span className={`text-[12px] font-black ${
                  ins.healthScore >= 90 ? 'text-green-400' : ins.healthScore >= 70 ? 'text-amber-400' : 'text-red-400'
                }`}>{ins.healthScore}%</span>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-gray-500 block mb-1">Key Issues</span>
                <p className="text-[12px] text-gray-300 line-clamp-2">{ins.issues || 'None reported'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-[#292B30]">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[11px] font-bold text-gray-300 hover:text-white rounded-lg transition-colors">
                <FileText className="w-3.5 h-3.5" /> Report
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[11px] font-bold text-gray-300 hover:text-white rounded-lg transition-colors">
                <Camera className="w-3.5 h-3.5" /> Photos
              </button>
              <button className="w-9 h-9 flex items-center justify-center bg-pink-400 hover:bg-pink-300 text-black rounded-lg transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
