'use client';

import { Plant } from '../../data/mock';
import { Leaf, Plus, Droplets, AlertTriangle, CheckCircle2, ChevronRight, Download } from 'lucide-react';

interface PlantManagementProps {
  plants: Plant[];
}

const statusColors: Record<string, string> = {
  'Planned': 'bg-gray-400/10 text-gray-400',
  'Ordered': 'bg-blue-400/10 text-blue-400',
  'Received': 'bg-indigo-400/10 text-indigo-400',
  'Planted': 'bg-green-400/10 text-green-400',
  'Replaced': 'bg-yellow-400/10 text-yellow-400',
  'Dead': 'bg-red-400/10 text-red-400',
  'Maintenance Required': 'bg-amber-400/10 text-amber-400',
};

const healthColors: Record<string, string> = {
  'Healthy': 'text-green-400',
  'Needs Water': 'text-blue-400',
  'Nutrient Deficiency': 'text-yellow-400',
  'Pest Issue': 'text-orange-400',
  'Disease': 'text-purple-400',
  'Damaged': 'text-amber-400',
  'Dead': 'text-red-400',
  'Replacement Required': 'text-red-400',
};

export default function PlantManagement({ plants }: PlantManagementProps) {
  const healthyCount = plants.filter(p => p.health === 'Healthy').length;
  const attentionCount = plants.filter(p => p.health !== 'Healthy' && p.health !== 'Dead').length;
  const criticalCount = plants.filter(p => p.health === 'Dead' || p.health === 'Replacement Required').length;

  const total = plants.length;
  const healthyPerc = total > 0 ? Math.round((healthyCount / total) * 100) : 0;
  const attentionPerc = total > 0 ? Math.round((attentionCount / total) * 100) : 0;
  const criticalPerc = total > 0 ? Math.round((criticalCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header & Health Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-white">PLANTATION</h2>
              <div className="text-[12px] font-semibold text-gray-400 mt-1">{plants.length} plant types tracked</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" /> Export List
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-[12px] font-bold rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Plant
            </button>
          </div>
        </div>

        {/* Compact Health Dashboard */}
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Plant Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-green-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
              <span className="text-[14px] font-bold text-white">{healthyPerc}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-amber-400 font-semibold flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5" /> Needs Attention
              </span>
              <span className="text-[14px] font-bold text-white">{attentionPerc}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-red-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Critical
              </span>
              <span className="text-[14px] font-bold text-white">{criticalPerc}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plants Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#111113]">
                {['Plant', 'Category', 'Location', 'Qty (Req / Plt / Pnd)', 'Health', 'Supplier', 'Cost', 'Status', ''].map(col => (
                  <th key={col} className={`text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap ${col.includes('Qty') ? 'text-center' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2025]">
              {plants.map(plant => (
                <tr key={plant.id} className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white mb-0.5">{plant.name}</span>
                      <span className="text-[10px] font-mono text-gray-600">{plant.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-[#0D0D0F] border border-[#292B30] text-gray-300 rounded uppercase tracking-wider">
                      {plant.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{plant.location}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-[12px]">
                      <span className="font-bold text-white w-6">{plant.required}</span>
                      <span className="text-gray-600">/</span>
                      <span className="font-bold text-green-400 w-6">{plant.planted}</span>
                      <span className="text-gray-600">/</span>
                      <span className={`font-bold w-6 ${plant.pending > 0 ? 'text-amber-400' : 'text-gray-500'}`}>{plant.pending}</span>
                      <span className="text-[10px] text-gray-500 ml-1">{plant.unit}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[12px] font-bold ${healthColors[plant.health]}`}>
                      {plant.health}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-gray-400">{plant.supplier}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[13px] font-bold text-white">₹{plant.cost.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusColors[plant.status]}`}>
                      {plant.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-[11px] font-bold text-green-400 hover:text-green-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                      Update <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {plants.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No plants tracked for this landscape</div>
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
