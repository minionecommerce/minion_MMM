'use client';

import { Expense, ProjectFinancials } from '../../data/mock';
import { CreditCard, Plus, Receipt } from 'lucide-react';

interface ProjectExpensesProps {
  expenses: Expense[];
  financials: ProjectFinancials;
}

const statusColors: Record<string, string> = {
  'Approved': 'bg-green-400/10 text-green-400',
  'Pending': 'bg-yellow-400/10 text-yellow-400',
  'Rejected': 'bg-red-400/10 text-red-400',
};

const getStatusStyle = (status?: string) => {
  const cls = (status && statusColors[status]) || 'bg-gray-400/10 text-gray-400';
  const border = cls.replace('bg-', 'border-').replace('/10', '/20');
  return `${border} ${cls}`;
};

export default function ProjectExpenses({ expenses, financials: f }: ProjectExpensesProps) {
  // Simple summary calculations from the mock expense data
  const totalExpenses = expenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Approved Expenses</div>
              <div className="text-[20px] font-black text-white">₹{totalExpenses.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Actual Cost</div>
            <div className="text-[20px] font-black text-white">₹{f.actualCost.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <button className="h-full flex items-center justify-center gap-2 px-5 py-3 bg-[#151619] border border-[#292B30] hover:border-gray-500 text-white text-[13px] font-bold rounded-xl transition-colors min-h-[88px]">
          <Plus className="w-4 h-4" /> Log Expense
        </button>

      </div>

      {/* Expenses Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-[#111113] border-b border-[#292B30]">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Expense Log</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#0D0D0F]">
                {['Expense ID', 'Date', 'Category', 'Description', 'Submitted By', 'Amount', 'Status', ''].map(col => (
                  <th key={col} className={`text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${col === 'Amount' ? 'text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2025]">
              {expenses.map(expense => (
                <tr key={expense.id} className="group hover:bg-[#1a1b1f] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-mono text-gray-400">{expense.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{expense.date}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-[#292B30] text-gray-300 rounded uppercase tracking-wider">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-gray-300 truncate max-w-[200px] block">{expense.description}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-gray-400">{expense.submittedBy}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[14px] font-bold text-white">₹{expense.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusStyle(expense.status)}`}>
                      {expense.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-gray-400 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="View Receipt">
                      <Receipt className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No expenses recorded</div>
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
