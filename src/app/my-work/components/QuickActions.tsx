'use client';

import {
  Plus, Phone, MapPin, CreditCard, FolderOpen,
  Upload, FileText, AlertCircle, ClipboardList
} from 'lucide-react';

const quickActions = [
  { label: 'New Task', icon: Plus, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20' },
  { label: 'Customer Follow-up', icon: Phone, color: 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20' },
  { label: 'Site Visit', icon: MapPin, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20' },
  { label: 'Expense / PPR', icon: CreditCard, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20' },
  { label: 'Project Update', icon: FolderOpen, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/20' },
  { label: 'Upload Document', icon: Upload, color: 'text-pink-400 bg-pink-400/10 border-pink-400/20 hover:bg-pink-400/20' },
  { label: 'Meeting Note', icon: ClipboardList, color: 'text-teal-400 bg-teal-400/10 border-teal-400/20 hover:bg-teal-400/20' },
  { label: 'Report Issue', icon: AlertCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20' },
];

export default function QuickActions() {
  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#1e2025]">
        <h2 className="text-[14px] font-bold text-white">Quick Actions</h2>
        <p className="text-[12px] text-gray-500 mt-0.5">Shortcuts to common actions.</p>
      </div>

      {/* Actions Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 active:scale-95 text-left ${action.color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
