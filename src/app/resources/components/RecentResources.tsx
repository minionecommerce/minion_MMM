'use client';

import { Resource } from '../data/mock';
import { FileText, Image as ImageIcon, Video, Folder, Link as LinkIcon, MoreHorizontal, Download, Eye } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'PDF': return <FileText className="w-4 h-4 text-red-400" />;
    case 'DOCX': return <FileText className="w-4 h-4 text-blue-400" />;
    case 'XLSX': return <FileText className="w-4 h-4 text-green-400" />;
    case 'PPTX': return <FileText className="w-4 h-4 text-orange-400" />;
    case 'Image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
    case 'Video': return <Video className="w-4 h-4 text-pink-400" />;
    case 'Folder': return <Folder className="w-4 h-4 text-yellow-400" />;
    case 'Link': return <LinkIcon className="w-4 h-4 text-gray-400" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

export default function RecentResources({ resources }: { resources: Resource[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Recently Added</h2>
        <button className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors">View All</button>
      </div>

      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#111113]">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => (
                <tr key={res.id} className="border-b border-[#292B30] hover:bg-[#1a1b1f] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center shrink-0">
                        {getIcon(res.type)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white group-hover:text-yellow-400 transition-colors">{res.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{res.size} • {res.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-gray-300">{res.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-gray-400">{res.owner}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-gray-400">{res.updatedAt}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#292B30] rounded transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#292B30] rounded transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#292B30] rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
