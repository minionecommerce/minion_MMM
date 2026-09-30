'use client';

import { MoreHorizontal, ChevronRight, User, MapPin, Droplets, Leaf } from 'lucide-react';
import { Park } from '../data/mock';

interface LandscapeTableProps {
  parks: Park[];
  onParkClick: (id: string) => void;
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'bg-green-400/10 text-green-400',
  'ON HOLD': 'bg-amber-400/10 text-amber-400',
  'COMPLETED': 'bg-teal-400/10 text-teal-400',
};

const stageColors: Record<string, string> = {
  'ENQUIRY': 'text-gray-400',
  'DESIGN': 'text-blue-400',
  'SITE PREPARATION': 'text-purple-400',
  'PLANTATION': 'text-green-400',
  'IRRIGATION': 'text-cyan-400',
  'LANDSCAPING': 'text-yellow-400',
  'LIGHTING': 'text-orange-400',
  'MAINTENANCE': 'text-pink-400',
  'COMPLETED': 'text-teal-400',
};

export default function LandscapeTable({ parks, onParkClick }: LandscapeTableProps) {
  if (parks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 bg-[#151619] rounded-xl border border-[#292B30]">
        <div className="text-4xl mb-3">🌳</div>
        <div className="text-[14px] font-semibold">No landscapes found</div>
        <div className="text-[12px] mt-1">Try adjusting your filters or create a new landscape</div>
      </div>
    );
  }

  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
      <table className="w-full min-w-[1200px]">
        <thead>
          <tr className="border-b border-[#292B30] bg-[#111113]">
            {['Landscape ID', 'Project', 'Location', 'Manager', 'Progress', 'Next Maint.', 'Value', 'Health', 'Status', ''].map(col => (
              <th key={col} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2025]">
          {parks.map(park => {
            return (
              <tr
                key={park.id}
                onClick={() => onParkClick(park.id)}
                className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors"
              >
                {/* ID & Customer */}
                <td className="px-4 py-3.5 pl-5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-yellow-400/80 hover:text-yellow-400 mb-0.5">{park.id}</span>
                    <span className="text-[11px] font-semibold text-gray-400">{park.customerName}</span>
                  </div>
                </td>

                {/* Project Info */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-white leading-tight">{park.name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[150px]">{park.type}</span>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                    <span className="truncate max-w-[120px]">{park.location}</span>
                  </div>
                </td>

                {/* Manager */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-300 font-semibold">
                    <User className="w-3 h-3 text-gray-500 shrink-0" />
                    <span className="truncate max-w-[100px]">{park.manager.split(' ')[0]}</span>
                  </div>
                </td>

                {/* Progress */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-white w-8">{park.progress}%</span>
                      <div className="w-16 h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            park.progress === 100 ? 'bg-green-400' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${park.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${stageColors[park.stage] || 'text-gray-400'}`}>
                      {park.stage}
                    </span>
                  </div>
                </td>

                {/* Next Maintenance */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[12px] font-semibold text-gray-300 whitespace-nowrap">
                      {new Date(park.nextMaintenance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </td>

                {/* Value */}
                <td className="px-4 py-3.5">
                  <span className="text-[13px] font-bold text-white">
                    ₹{park.financials.contractValue.toLocaleString('en-IN')}
                  </span>
                </td>

                {/* Health */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-bold ${
                      park.health.overall >= 90 ? 'text-green-400' : 
                      park.health.overall >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>{park.health.overall}%</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${statusColors[park.status] ?? 'bg-gray-400/10 text-gray-400'}`}>
                    {park.status}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3.5 pr-5 text-right">
                  <button className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
