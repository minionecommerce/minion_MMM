'use client';

import { Heart, Plus, Calendar, CheckCircle2, User } from 'lucide-react';

interface ImpactTabProps {
  ledgers: any[];
  employees: any[];
  onOpenSubmit: () => void;
}

export default function ImpactTab({ ledgers, employees, onOpenSubmit }: ImpactTabProps) {
  const impactEntries = ledgers.filter((l: any) => l.category === 'Impact' || l.source === 'Community Impact');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Community Impact & Social Responsibility</h2>
          <p className="text-[12px] text-gray-400">Track employee volunteering, environmental drives, and social welfare contributions</p>
        </div>
        <button
          onClick={onOpenSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black text-[12px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(52,211,153,0.15)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Impact Activity
        </button>
      </div>

      {impactEntries.length === 0 ? (
        <div className="text-center py-16 bg-[#151619] border border-[#292B30] rounded-xl">
          <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-[14px]">No impact activities logged yet</h3>
          <p className="text-gray-500 text-[12px] mt-1 mb-4">Click below to record community or environmental initiatives.</p>
          <button
            onClick={onOpenSubmit}
            className="px-4 py-2 bg-emerald-400 text-black font-bold text-[12px] rounded-lg"
          >
            Log Impact Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {impactEntries.map((imp: any) => {
            const empName = imp.employee?.user?.name || imp.employee?.designation || 'Employee';
            return (
              <div key={imp.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Social Impact</span>
                    </div>
                    <span className="text-[12px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded">
                      +{imp.points} PTS
                    </span>
                  </div>

                  <h3 className="text-[14px] font-bold text-white mb-2 leading-snug">{imp.description}</h3>
                  
                  <div className="flex items-center gap-2 text-[12px] text-gray-300 mb-4">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-semibold">{empName}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#292B30] flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(imp.createdAt).toLocaleDateString()}
                  </div>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
