'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface CRMSearchFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

const filterOptions = {
  status: ['', 'New', 'Contacted', 'Requirements Collected', 'Preliminary Quote Sent', 'Follow-up', 'Site Visit Scheduled', 'Site Visit Completed', 'Final Quote Sent', 'Negotiation', 'Won', 'Lost', 'On Hold'],
  customerType: ['', 'Individual', 'Company', 'Builder', 'Architect', 'Interior Designer', 'Contractor'],
  priority: ['', 'High', 'Medium', 'Low'],
  source: ['', 'Website', 'Referral', 'Walk-in', 'Social Media', 'Exhibition', 'Cold Call', 'Google Ads'],
};

function FilterSelect({ label, optKey, filters, onChange }: { label: string; optKey: keyof typeof filterOptions; filters: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={filters[optKey] ?? ''}
        onChange={e => onChange(optKey, e.target.value)}
        className={`appearance-none bg-[#0D0D0F] border rounded-lg pl-3 pr-7 py-2 text-[12px] font-medium focus:outline-none focus:border-yellow-400/50 transition-colors cursor-pointer ${
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

export default function CRMSearchFilters({ search, onSearchChange, filters, onFilterChange, onClearFilters }: CRMSearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-2">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search leads by name, phone, email, lead ID, location..."
            className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-[12px] font-semibold transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
              : 'bg-[#0D0D0F] border-[#292B30] text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-yellow-400 text-black text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button onClick={onClearFilters} className="text-[11px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-[#0D0D0F] rounded-lg border border-[#292B30]">
          <FilterSelect label="Status" optKey="status" filters={filters} onChange={onFilterChange} />
          <FilterSelect label="Customer Type" optKey="customerType" filters={filters} onChange={onFilterChange} />
          <FilterSelect label="Priority" optKey="priority" filters={filters} onChange={onFilterChange} />
          <FilterSelect label="Lead Source" optKey="source" filters={filters} onChange={onFilterChange} />
        </div>
      )}
    </div>
  );
}
