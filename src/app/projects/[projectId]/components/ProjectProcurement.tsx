'use client';

import { ProcurementItem } from '../../data/mock';
import { Package, Truck, Plus, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface ProjectProcurementProps {
  procurement: ProcurementItem[];
}

const pStatusColors: Record<string, string> = {
  'Requested': 'bg-gray-400/10 text-gray-400',
  'Quotation': 'bg-blue-400/10 text-blue-400',
  'Approved': 'bg-indigo-400/10 text-indigo-400',
  'Ordered': 'bg-yellow-400/10 text-yellow-400',
  'Partially Received': 'bg-amber-400/10 text-amber-400',
  'Received': 'bg-green-400/10 text-green-400',
  'Cancelled': 'bg-red-400/10 text-red-400',
};

const paymentStatusColors: Record<string, string> = {
  'Pending': 'text-red-400',
  'Partially Paid': 'text-amber-400',
  'Paid': 'text-green-400',
};

export default function ProjectProcurement({ procurement }: ProjectProcurementProps) {
  const orderedCount = procurement.filter(p => p.purchaseStatus === 'Ordered' || p.purchaseStatus === 'Partially Received').length;
  const receivedCount = procurement.filter(p => p.purchaseStatus === 'Received').length;
  
  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">PROCUREMENT</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[12px] font-bold text-gray-400">Items: <span className="text-white">{procurement.length}</span></span>
              <span className="text-[12px] font-bold text-yellow-400">Ordered: {orderedCount}</span>
              <span className="text-[12px] font-bold text-green-400">Received: {receivedCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
            + Add Vendor
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Purchase Request
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#111113]">
                {['Material', 'Vendor', 'Qty (Req / Rcv / Pend)', 'Required Date', 'Purchase Status', 'Payment', ''].map(col => (
                  <th key={col} className={`text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap ${col.includes('Qty') ? 'text-center' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2025]">
              {procurement.map(item => (
                <tr key={item.id} className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white mb-0.5">{item.material}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-600">{item.id}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.boqCategory}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{item.vendor}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-[12px]">
                      <span className="font-bold text-white w-6">{item.requiredQty}</span>
                      <span className="text-gray-600">/</span>
                      <span className="font-bold text-green-400 w-6">{item.receivedQty}</span>
                      <span className="text-gray-600">/</span>
                      <span className="font-bold text-red-400 w-6">{item.pendingQty}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[12px] font-semibold text-gray-300">{item.requiredDate}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pStatusColors[item.purchaseStatus]}`}>
                      {item.purchaseStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${paymentStatusColors[item.paymentStatus]}`}>
                      {item.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                      Update <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {procurement.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No procurement records found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
