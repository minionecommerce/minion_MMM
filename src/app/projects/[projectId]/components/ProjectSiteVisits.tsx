'use client';

import { SiteVisit } from '../../data/mock';
import { MapPin, User, Calendar, Plus, Clock } from 'lucide-react';

interface ProjectSiteVisitsProps {
  siteVisits: SiteVisit[];
  location: string;
  customerName: string;
}

const statusColors: Record<string, string> = {
  'Scheduled': 'bg-blue-400/10 text-blue-400',
  'Completed': 'bg-green-400/10 text-green-400',
  'Cancelled': 'bg-red-400/10 text-red-400',
};

export default function ProjectSiteVisits({ siteVisits, location, customerName }: ProjectSiteVisitsProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">SITE VISITS</h2>
            <div className="text-[12px] font-semibold text-gray-400 mt-1">{siteVisits.length} total visits</div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Schedule Site Visit
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siteVisits.map(visit => (
          <div key={visit.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-white leading-tight">{visit.purpose}</span>
                <span className="text-[10px] font-mono text-gray-600 mt-0.5">{visit.id}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusColors[visit.status]}`}>
                {visit.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[12px] text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="font-semibold">{visit.date}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate">{location} ({customerName})</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>Assigned to: <span className="font-semibold text-gray-300">{visit.assignedTo}</span></span>
              </div>
            </div>

            {visit.notes && (
              <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Notes</div>
                <p className="text-[12px] text-gray-400 leading-relaxed italic">{visit.notes}</p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button className="flex-1 py-2 bg-[#0D0D0F] border border-[#292B30] text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
                View Details
              </button>
              {visit.status === 'Scheduled' && (
                <button className="flex-1 py-2 bg-green-500/10 border border-green-500/20 text-[11px] font-semibold text-green-400 hover:bg-green-500/20 rounded-lg transition-colors">
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        ))}

        {siteVisits.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#292B30] rounded-xl">
            <div className="text-[14px] font-semibold">No site visits scheduled</div>
          </div>
        )}
      </div>

    </div>
  );
}
