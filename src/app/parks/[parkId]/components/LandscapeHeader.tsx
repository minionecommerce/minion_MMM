'use client';

import { Park } from '../../data/mock';
import { ArrowLeft, MapPin, User, Edit2, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface LandscapeHeaderProps {
  park: Park;
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'bg-green-400/10 text-green-400',
  'ON HOLD': 'bg-amber-400/10 text-amber-400',
  'COMPLETED': 'bg-teal-400/10 text-teal-400',
};

export default function LandscapeHeader({ park }: LandscapeHeaderProps) {
  return (
    <div className="bg-[#111113] border-b border-[#292B30] px-6 py-5">
      <div className="max-w-[1700px] mx-auto">
        <Link href="/parks" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-yellow-400 uppercase tracking-wider mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Parks
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[24px] font-black tracking-tight text-white uppercase">{park.name}</h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusColors[park.status] ?? 'bg-gray-400/10 text-gray-400'}`}>
                {park.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Landscape ID:</span>
                <span className="text-[12px] font-mono text-yellow-400">{park.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Customer:</span>
                <span className="text-[12px] font-semibold text-gray-300">{park.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-[12px] text-gray-400">{park.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Type:</span>
                <span className="text-[12px] text-gray-400">{park.type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-[12px] text-gray-400">{park.manager}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Progress</div>
              <div className="flex items-center gap-2">
                <div className="text-[20px] font-black text-white leading-none">{park.progress}%</div>
                <div className="w-24 h-2 bg-[#151619] rounded-full overflow-hidden border border-[#292B30]">
                  <div 
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${park.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="w-px h-10 bg-[#292B30] mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-lg bg-[#151619] border border-[#292B30] flex items-center justify-center hover:border-gray-500 text-gray-400 hover:text-white transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[12px] font-bold text-black transition-all">
                Actions <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
