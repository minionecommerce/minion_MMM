'use client';

import { Document } from '../../data/mock';
import { FileText, Download, Share2, Upload, Eye } from 'lucide-react';

interface ProjectDocumentsProps {
  documents: Document[];
}

export default function ProjectDocuments({ documents }: ProjectDocumentsProps) {
  // Group documents by type
  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">DOCUMENTS</h2>
            <div className="text-[12px] font-semibold text-gray-400 mt-1">{documents.length} files uploaded</div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Document Groups */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(grouped).map(([type, docs]) => (
          <div key={type} className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#111113] border-b border-[#292B30]">
              <h3 className="text-[12px] font-bold text-yellow-400 uppercase tracking-wider">{type}</h3>
            </div>
            
            <div className="divide-y divide-[#1e2025]">
              {docs.map(doc => (
                <div key={doc.id} className="p-4 hover:bg-[#1a1b1f] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0D0D0F] border border-[#292B30] rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white leading-tight mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span>{doc.uploadedDate}</span>
                        <span>•</span>
                        <span>Uploaded by: <span className="font-semibold text-gray-300">{doc.uploadedBy}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="py-12 text-center text-gray-500 border border-dashed border-[#292B30] rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-600" />
            <div className="text-[14px] font-semibold mb-1">No documents uploaded</div>
            <div className="text-[12px]">Upload BOQ, PO, Drawings, Photos, etc.</div>
          </div>
        )}
      </div>

    </div>
  );
}
