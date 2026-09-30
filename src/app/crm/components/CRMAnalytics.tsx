'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

interface AnalyticsData {
  leadConversion: { value: number; desc: string };
  followUpRate: { value: number; desc: string };
  siteVisitConversion: { value: number; desc: string };
  quoteAcceptance: { value: number; desc: string };
  dealConversion: { value: number; desc: string };
  pipelineValue: { value: number; desc: string };
}

interface CRMAnalyticsProps {
  analytics: AnalyticsData | null;
}

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

const now = new Date();
const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

export default function CRMAnalytics({ analytics }: CRMAnalyticsProps) {
  const [period, setPeriod] = useState('This Month');

  if (!analytics) {
    return (
      <div className="px-6 pb-4">
        <div className="bg-[#151619] rounded-xl border border-[#292B30] p-5">
          <div className="text-center text-gray-600 py-8 text-[13px]">Analytics data unavailable</div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Lead Conversion',
      value: analytics.leadConversion.value,
      isPercent: true,
      color: 'from-yellow-400 to-yellow-300',
      desc: analytics.leadConversion.desc,
    },
    {
      label: 'Follow-up Rate',
      value: analytics.followUpRate.value,
      isPercent: true,
      color: 'from-green-400 to-green-300',
      desc: analytics.followUpRate.desc,
    },
    {
      label: 'Site Visit Conv.',
      value: analytics.siteVisitConversion.value,
      isPercent: true,
      color: 'from-blue-400 to-blue-300',
      desc: analytics.siteVisitConversion.desc,
    },
    {
      label: 'Quote Acceptance',
      value: analytics.quoteAcceptance.value,
      isPercent: true,
      color: 'from-purple-400 to-purple-300',
      desc: analytics.quoteAcceptance.desc,
    },
    {
      label: 'Deal Conversion',
      value: analytics.dealConversion.value,
      isPercent: true,
      color: 'from-pink-400 to-pink-300',
      desc: analytics.dealConversion.desc,
    },
    {
      label: 'Pipeline Value',
      value: analytics.pipelineValue.value,
      isPercent: false,
      color: 'from-orange-400 to-orange-300',
      desc: analytics.pipelineValue.desc,
    },
  ];

  return (
    <div className="px-6 pb-4">
      <div className="bg-[#151619] rounded-xl border border-[#292B30] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-bold text-white">CRM Analytics</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{monthLabel} — Key Performance Metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-1.5 text-[11px] text-gray-400 focus:outline-none focus:border-yellow-400/50 transition-colors appearance-none"
            >
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="flex flex-col">
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">{m.label}</div>
              <div className="w-full bg-[#0D0D0F] rounded-full h-1.5 mb-2 overflow-hidden border border-[#292B30]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-1000`}
                  style={{ width: `${m.isPercent ? m.value : 100}%` }}
                />
              </div>
              <div className="text-[16px] font-bold text-white">
                {m.isPercent ? `${m.value}%` : formatCurrency(m.value)}
              </div>
              <div className="text-[10px] text-gray-600">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
