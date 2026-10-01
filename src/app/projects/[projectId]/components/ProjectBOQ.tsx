'use client';

import { BOQItem } from '../../data/mock';
import { IndianRupee, TrendingDown, TrendingUp, Download, Edit2 } from 'lucide-react';

interface ProjectBOQProps {
  boq: BOQItem[];
}

export default function ProjectBOQ({ boq }: ProjectBOQProps) {
  // Group BOQ items by category
  const grouped = boq.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BOQItem[]>);

  const totalQuoted = boq.reduce((sum, i) => sum + i.quotedAmount, 0);
  const totalCost = boq.reduce((sum, i) => sum + i.actualCost, 0);
  const totalVariance = boq.reduce((sum, i) => sum + i.variance, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-black text-white">PROJECT BOQ</h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#151619] border border-[#292B30] hover:border-gray-500 text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Export BOQ
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-yellow-400/10 border border-yellow-400/20 hover:border-yellow-400/50 text-[11px] font-bold text-yellow-400 rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit Mode
          </button>
        </div>
      </div>

      {/* BOQ Tables per Category */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => {
          
          const catQuoted = items.reduce((sum, i) => sum + i.quotedAmount, 0);
          const catCost = items.reduce((sum, i) => sum + i.actualCost, 0);
          
          return (
            <div key={category} className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-[#111113] border-b border-[#292B30] flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-yellow-400 uppercase tracking-wider">{category}</h3>
                <div className="text-[11px] font-bold text-gray-400">
                  Total: <span className="text-white">₹{catQuoted.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#292B30] bg-[#0D0D0F]">
                      <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3 w-[25%]">Item</th>
                      <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Qty</th>
                      <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Quoted Amount</th>
                      <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Actual Cost</th>
                      <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Profit Margin</th>
                      <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2025]">
                    {items.map(item => {
                      const margin = item.quotedAmount - item.actualCost;
                      const marginPercent = Math.round((margin / item.quotedAmount) * 100) || 0;

                      return (
                        <tr key={item.id} className="hover:bg-[#1a1b1f] transition-colors group">
                          <td className="px-5 py-4">
                            <div className="text-[12px] font-bold text-white">{item.item}</div>
                            <div className="text-[10px] font-mono text-gray-600 mt-0.5">{item.id}</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-[12px] font-semibold text-gray-300">{item.quantity}</span>
                            <span className="text-[10px] text-gray-500 ml-1">{item.unit}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-[13px] font-bold text-white">₹{item.quotedAmount.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-[13px] font-bold text-gray-300">₹{item.actualCost.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-[12px] font-bold flex items-center gap-1 ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {margin >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                ₹{Math.abs(margin).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500">{marginPercent}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              item.status === 'Completed' ? 'bg-green-400/10 text-green-400' :
                              item.status === 'In Progress' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-gray-400/10 text-gray-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Summary Footer */}
      <div className="bg-[#111113] border border-[#292B30] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Quoted Amount</div>
            <div className="text-[24px] font-black text-white leading-none">₹{totalQuoted.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-[#292B30]" />

        <div>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Actual Cost</div>
          <div className="text-[20px] font-bold text-gray-300 leading-none">₹{totalCost.toLocaleString('en-IN')}</div>
        </div>

        <div className="hidden md:block w-px h-12 bg-[#292B30]" />

        <div>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Variance (Profit)</div>
          <div className={`text-[20px] font-black leading-none ${totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{totalVariance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

    </div>
  );
}
