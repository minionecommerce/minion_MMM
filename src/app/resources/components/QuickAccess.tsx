'use client';

import { Resource } from '../data/mock';
import { FileText, Image as ImageIcon, Video, Folder, Link as LinkIcon, MoreVertical, Bookmark } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'PDF': return <FileText className="w-5 h-5 text-red-400" />;
    case 'DOCX': return <FileText className="w-5 h-5 text-blue-400" />;
    case 'XLSX': return <FileText className="w-5 h-5 text-green-400" />;
    case 'PPTX': return <FileText className="w-5 h-5 text-orange-400" />;
    case 'Image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
    case 'Video': return <Video className="w-5 h-5 text-pink-400" />;
    case 'Folder': return <Folder className="w-5 h-5 text-yellow-400" />;
    case 'Link': return <LinkIcon className="w-5 h-5 text-gray-400" />;
    default: return <FileText className="w-5 h-5 text-gray-400" />;
  }
};

export default function QuickAccess({ resources }: { resources: Resource[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Important Resources</h2>
        <button className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors">View All</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map(res => (
          <div key={res.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-4 hover:border-gray-500 transition-colors group cursor-pointer flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#111113] border border-[#292B30] flex items-center justify-center shrink-0 group-hover:border-gray-500 transition-colors">
                {getIcon(res.type)}
              </div>
              <div className="flex items-center gap-1">
                {res.isFavorite && <Bookmark className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#1a1b1f] transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-[13px] font-bold text-white mb-1 line-clamp-1 group-hover:text-yellow-400 transition-colors">{res.title}</h3>
            <p className="text-[11px] text-gray-400 line-clamp-2 mb-4 flex-1">{res.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-[#292B30] mt-auto">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{res.category}</span>
              <span className="text-[10px] font-semibold text-gray-400">{res.size || res.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
