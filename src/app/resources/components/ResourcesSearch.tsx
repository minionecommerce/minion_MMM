'use client';

import { Search, Command } from 'lucide-react';

export default function ResourcesSearch() {
  return (
    <div className="px-6 pb-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search documents, SOPs, products, templates, policies..." 
          className="w-full bg-[#151619] border border-[#292B30] rounded-xl pl-12 pr-16 py-4 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/50 hover:border-[#3f4148] transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-[#0D0D0F] border border-[#292B30] px-2 py-1 rounded">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
