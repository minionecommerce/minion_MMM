'use client';

import { useMyWork } from "../MyWorkContext";

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-[12px] font-bold text-white">{value}%</span>
      </div>
      <div className="w-full bg-[#1e2025] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="text-center">
      <div className="text-[18px] font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MyPerformance() {
  const { performance } = useMyWork();

  const { overall, metrics, stats } = performance;

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[#1e2025]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-white">My Performance</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">September 2026</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-white">{overall}%</div>
            <div className="text-[11px] text-gray-500">Overall</div>
          </div>
        </div>

        {/* Radial-like indicator */}
        <div className="mt-3">
          <div className="w-full bg-[#1e2025] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-1000"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4 space-y-3">
        {metrics.map(m => (
          <MetricBar key={m.label} label={m.label} value={m.value} color={m.color} />
        ))}
      </div>

      {/* Stats Grid */}
      <div className="px-5 pb-5">
        <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 grid grid-cols-3 gap-4">
          <div className="col-span-3 text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-1">September Stats</div>
          <StatBox label="Tasks Done" value={`${stats.tasksCompleted}/${stats.tasksAssigned}`} />
          <StatBox label="Follow-ups" value={`${stats.followUpsCompleted}/${stats.followUpsTotal}`} />
          <StatBox label="Projects" value={`${stats.projectsActive} Active`} sub={`${stats.projectsCompleted} done`} />
        </div>
      </div>
    </div>
  );
}
