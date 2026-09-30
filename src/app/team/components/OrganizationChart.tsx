'use client';

import { Network, Users } from 'lucide-react';

export default function OrganizationChart() {
  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 min-h-[400px] flex items-center justify-center overflow-x-auto relative">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Network className="w-4 h-4 text-gray-500" />
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Company Structure</span>
      </div>

      <div className="flex flex-col items-center mt-12 min-w-max">
        {/* CEO Node */}
        <div className="bg-[#111113] border-2 border-yellow-400/50 rounded-xl p-4 w-64 text-center z-10 relative">
          <div className="text-[14px] font-black text-white">Sivabalan Subramanian</div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1">CEO, Founder & MD</div>
        </div>

        {/* Vertical Line */}
        <div className="w-px h-8 bg-[#292B30]" />

        {/* Horizontal Line connecting children */}
        <div className="w-[800px] h-px bg-[#292B30]" />

        {/* Children Branches */}
        <div className="flex justify-between w-[800px] pt-8 relative">
          {/* Vertical lines down to children */}
          <div className="absolute top-0 left-0 w-px h-8 bg-[#292B30]" />
          <div className="absolute top-0 left-[25%] w-px h-8 bg-[#292B30]" />
          <div className="absolute top-0 left-[50%] w-px h-8 bg-[#292B30]" />
          <div className="absolute top-0 left-[75%] w-px h-8 bg-[#292B30]" />
          <div className="absolute top-0 right-0 w-px h-8 bg-[#292B30]" />

          {/* Child Nodes */}
          
          <div className="bg-[#111113] border border-[#292B30] rounded-xl p-4 w-40 text-center relative -ml-20">
            <div className="text-[12px] font-bold text-white mb-1">Project Operations</div>
            <div className="text-[10px] text-gray-500">Dinesh S.</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-600 font-semibold">
              <Users className="w-3 h-3" /> 6 Members
            </div>
          </div>

          <div className="bg-[#111113] border border-[#292B30] rounded-xl p-4 w-40 text-center relative -ml-10">
            <div className="text-[12px] font-bold text-white mb-1">Sales</div>
            <div className="text-[10px] text-gray-500">Sales Manager</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-600 font-semibold">
              <Users className="w-3 h-3" /> 5 Members
            </div>
          </div>

          <div className="bg-[#111113] border border-[#292B30] rounded-xl p-4 w-40 text-center relative">
            <div className="text-[12px] font-bold text-white mb-1">Architecture</div>
            <div className="text-[10px] text-gray-500">Abishek S.</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-600 font-semibold">
              <Users className="w-3 h-3" /> 3 Members
            </div>
          </div>

          <div className="bg-[#111113] border border-[#292B30] rounded-xl p-4 w-40 text-center relative -mr-10">
            <div className="text-[12px] font-bold text-white mb-1">Finance</div>
            <div className="text-[10px] text-gray-500">Nivashini</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-600 font-semibold">
              <Users className="w-3 h-3" /> 2 Members
            </div>
          </div>

          <div className="bg-[#111113] border border-[#292B30] rounded-xl p-4 w-40 text-center relative -mr-20">
            <div className="text-[12px] font-bold text-white mb-1">HR & Proc.</div>
            <div className="text-[10px] text-gray-500">UitthaMugi & Vignesh</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-600 font-semibold">
              <Users className="w-3 h-3" /> 3 Members
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
