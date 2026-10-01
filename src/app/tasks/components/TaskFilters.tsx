'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

const filterOptions = {
  priority: ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  status: ['', 'Not Started', 'Assigned', 'Accepted', 'In Progress', 'Blocked', 'On Hold', 'Completed', 'Verified', 'Closed', 'Cancelled'],
  type: ['', 'Project Task', 'CRM Task', 'Follow-up', 'Site Visit', 'Procurement', 'BOQ', 'PPR / Finance', 'Customer Request', 'Internal Task', 'Meeting', 'Inspection', 'Maintenance', 'Learning', 'HR', 'Management', 'Other'],
  assignedBy: ['', 'Dinesh', 'Rahul S A', 'Jaya', 'System'],
};

function FilterSelect({ label, optKey, filters, onChange }: { label: string; optKey: keyof typeof filterOptions; filters: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div className="relative min-w-[150px]">
      <select
        value={filters[optKey] ?? ''}
        onChange={e => onChange(optKey, e.target.value)}
        className={`w-full appearance-none bg-[#0D0D0F] border rounded-lg pl-3 pr-7 py-2 text-[12px] font-medium focus:outline-none focus:border-yellow-400/50 transition-colors cursor-pointer ${
          filters[optKey] ? 'border-yellow-400/50 text-yellow-400' : 'border-[#292B30] text-gray-400 hover:border-gray-500'
        }`}
      >
        <option value="">{label}</option>
        {filterOptions[optKey].slice(1).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
    </div>
  );
}

export default function TaskFilters({ search, onSearchChange, filters, onFilterChange, onClearFilters }: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Sub-tabs for current view (e.g., My Tasks) */}
        <div className="flex items-center gap-1 bg-[#151619] border border-[#292B30] p-1 rounded-xl w-fit">
          {['Today', 'Upcoming', 'Overdue', 'Completed'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors ${
                tab === 'Today' ? 'bg-[#292B30] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search tasks, projects, customers..."
              className="w-full bg-[#151619] border border-[#292B30] rounded-xl pl-9 pr-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
            />
            {search && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center w-10 h-9 rounded-xl border transition-colors shrink-0 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                : 'bg-[#151619] border-[#292B30] text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#151619] rounded-xl border border-[#292B30]">
          <div className="flex flex-wrap gap-3">
            <FilterSelect label="Priority" optKey="priority" filters={filters} onChange={onFilterChange} />
            <FilterSelect label="Status" optKey="status" filters={filters} onChange={onFilterChange} />
            <FilterSelect label="Task Type" optKey="type" filters={filters} onChange={onFilterChange} />
            <FilterSelect label="Assigned By" optKey="assignedBy" filters={filters} onChange={onFilterChange} />
          </div>
          
          {activeFiltersCount > 0 && (
            <button onClick={onClearFilters} className="text-[11px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 font-semibold px-2">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
