'use client';

import { Payment, ProjectFinancials } from '../../data/mock';
import { IndianRupee, Download, Plus, Receipt } from 'lucide-react';

interface ProjectPaymentsProps {
  payments: Payment[];
  financials: ProjectFinancials;
}

const statusColors: Record<string, string> = {
  'Received': 'bg-green-400/10 text-green-400',
  'Pending': 'bg-yellow-400/10 text-yellow-400',
  'Failed': 'bg-red-400/10 text-red-400',
};

const getStatusStyle = (status?: string) => {
  const cls = (status && statusColors[status]) || 'bg-gray-400/10 text-gray-400';
  const border = cls.replace('bg-', 'border-').replace('/10', '/20');
  return `${border} ${cls}`;
};

export default function ProjectPayments({ payments, financials: f }: ProjectPaymentsProps) {
  const percentReceived = Math.round((f.receivedAmount / f.totalContractValue) * 100) || 0;

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 col-span-1 md:col-span-2 lg:col-span-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Contract Value</div>
              <div className="text-[20px] font-black text-white">₹{f.totalContractValue.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Includes ₹{f.gst.toLocaleString('en-IN')} GST</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-[#292B30]" />

          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="text-gray-500">Payment Progress</span>
              <span className="text-green-400">{percentReceived}% Received</span>
            </div>
            <div className="w-full h-2 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
              <div 
                className="h-full rounded-full bg-green-400 transition-all"
                style={{ width: `${percentReceived}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-2">
              <span>Received: ₹{f.receivedAmount.toLocaleString('en-IN')}</span>
              <span className="text-yellow-400">Pending: ₹{f.pendingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div className="hidden md:block w-px h-12 bg-[#292B30]" />
          
          <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,196,0,0.2)]">
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        </div>

      </div>

      {/* Payments Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-[#111113] border-b border-[#292B30] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Payment History</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0D0F] border border-[#292B30] text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Statement
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#0D0D0F]">
                {['Payment ID', 'Date', 'Method', 'Reference', 'Amount', 'Status', ''].map(col => (
                  <th key={col} className={`text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${col === 'Amount' ? 'text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2025]">
              {payments.map(payment => (
                <tr key={payment.id} className="group hover:bg-[#1a1b1f] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-mono text-yellow-400/80">{payment.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{payment.date}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-gray-400">{payment.method}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-mono text-gray-400">{payment.reference}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[14px] font-bold text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusStyle(payment.status)}`}>
                      {payment.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-gray-400 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Receipt">
                      <Receipt className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No payments recorded</div>
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
