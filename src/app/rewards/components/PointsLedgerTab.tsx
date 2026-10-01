'use client';

import { useState } from 'react';
import { History, Search, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';

interface PointsLedgerTabProps {
  ledgers: any[];
}

export default function PointsLedgerTab({ ledgers }: PointsLedgerTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = ledgers.filter((l: any) => {
    const empName = l.employee?.user?.name || l.employee?.designation || '';
    const desc = l.description || '';
    const src = l.source || '';
    const matchesSearch = empName.toLowerCase().includes(search.toLowerCase()) || 
                          desc.toLowerCase().includes(search.toLowerCase()) ||
                          src.toLowerCase().includes(search.toLowerCase());
    
    const matchesCat = categoryFilter === 'ALL' || l.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(ledgers.map((l: any) => l.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Points Audit Ledger</h2>
          <p className="text-[12px] text-gray-400">Complete immutable record of all points earned, redeemed, and reversed</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0D0D0F] border border-[#292B30] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-yellow-400/50"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-white">No ledger transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] border-b border-[#292B30] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]/50 text-[12px]">
                {filtered.map((entry: any) => {
                  const empName = entry.employee?.user?.name || entry.employee?.designation || 'Employee';
                  const isPositive = entry.points > 0;
                  return (
                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                        {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {empName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-[#0D0D0F] border border-[#292B30] px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 uppercase">
                          {entry.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">
                        {entry.source || 'System'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded text-[12px] ${
                          isPositive
                            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                            : 'bg-red-400/10 text-red-400 border border-red-400/20'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {isPositive ? `+${entry.points}` : entry.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
