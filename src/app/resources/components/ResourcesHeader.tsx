'use client';

import { Database, Plus, FolderPlus, Link as LinkIcon, Filter, Search } from 'lucide-react';

export default function ResourcesHeader() {
  return (
    <div className="px-6 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-white">RESOURCES</h1>
        </div>
        <p className="text-[13px] text-gray-400 max-w-xl font-medium">
          Everything your team needs, in one place.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-gray-300 hover:text-white transition-all">
          <Filter className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-[#292B30] mx-1 hidden lg:block" />
        
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all">
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Link</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all">
          <FolderPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Folder</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[12px] font-bold text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)]">
          <Plus className="w-4 h-4" />
          Upload Resource
        </button>
      </div>
    </div>
  );
}
