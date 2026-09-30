'use client';

import { Park, parkStages } from '../../data/mock';
import { Target, IndianRupee, ArrowUpRight, CheckCircle2, AlertTriangle, Droplets, Leaf } from 'lucide-react';
import Link from 'next/link';

interface LandscapeOverviewProps {
  park: Park;
}

export default function LandscapeOverview({ park }: LandscapeOverviewProps) {
  const f = park.financials;
  const currentStageIdx = parkStages.indexOf(park.stage);

  return (
    <div className="space-y-6">
      
      {/* ── ALERTS ── */}
      {park.alerts && park.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {park.alerts.map((alert, i) => {
            const isWarning = alert.includes('⚠');
            return (
              <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                isWarning ? 'bg-amber-400/5 border-amber-400/20 text-amber-400' : 'bg-green-400/5 border-green-400/20 text-green-400'
              }`}>
                {isWarning ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="text-[12px] font-semibold">{alert.replace('⚠ ', '').replace('✓ ', '')}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: Health & Progress ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Stepper */}
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-6">Landscape Progress</h3>
            
            <div className="relative flex items-center justify-between">
              {/* Line background */}
              <div className="absolute left-0 right-0 top-3 h-px bg-[#292B30]" />
              
              {/* Active line */}
              <div 
                className="absolute left-0 top-3 h-px bg-yellow-400 transition-all duration-1000" 
                style={{ width: `${Math.max(0, (currentStageIdx / (parkStages.length - 1)) * 100)}%` }} 
              />

              {parkStages.map((stage, idx) => {
                const isDone = idx < currentStageIdx || park.status === 'COMPLETED';
                const isCurrent = idx === currentStageIdx && park.status !== 'COMPLETED';

                return (
                  <div key={stage} className="flex flex-col items-center relative z-10 w-16">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-[#151619] transition-all ${
                      isDone ? 'border-green-400' :
                      isCurrent ? 'border-yellow-400 shadow-[0_0_10px_rgba(255,196,0,0.3)]' :
                      'border-[#292B30]'
                    }`}>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                      {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />}
                    </div>
                    <span className={`text-center text-[9px] font-bold uppercase tracking-wider mt-2 max-w-full break-words ${
                      isCurrent ? 'text-yellow-400' : isDone ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Landscape Information</h3>
              <div className="space-y-3">
                <InfoRow label="Area" value={park.area} />
                <InfoRow label="Landscape Type" value={park.type} />
                <InfoRow label="Project Manager" value={park.manager} />
                <InfoRow label="Site Supervisor" value={park.supervisor} />
                <InfoRow label="Priority" value={park.priority} valueColor={park.priority === 'High' || park.priority === 'Critical' ? 'text-red-400' : 'text-white'} />
              </div>
            </div>

            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">CRM & Project References</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-semibold uppercase">Project</span>
                  <Link href={`/projects/${park.projectId}`} className="text-[12px] font-mono text-blue-400 hover:underline flex items-center gap-1">
                    {park.projectId} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-semibold uppercase">Lead</span>
                  <Link href="/crm" className="text-[12px] font-mono text-blue-400 hover:underline flex items-center gap-1">
                    {park.crmRefs.leadId} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-semibold uppercase">Deal</span>
                  <Link href="/crm" className="text-[12px] font-mono text-blue-400 hover:underline flex items-center gap-1">
                    {park.crmRefs.dealId} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-semibold uppercase">Quote</span>
                  <Link href="/crm" className="text-[12px] font-mono text-blue-400 hover:underline flex items-center gap-1">
                    {park.crmRefs.quoteId} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Financials & Health ── */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-gray-400" /> Financial Summary
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#292B30] pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project Value</span>
                <span className="text-[16px] font-black text-yellow-400">₹{f.contractValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#292B30] pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actual Cost</span>
                <span className="text-[14px] font-bold text-white">₹{f.actualCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#292B30] pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount Received</span>
                <span className="text-[14px] font-bold text-green-400">₹{f.receivedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#292B30] pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Balance</span>
                <span className="text-[14px] font-bold text-white">₹{f.balance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Expected Profit</span>
                  <span className="text-[13px] font-bold text-gray-300">₹{f.expectedProfit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Current Profit</span>
                  <span className={`text-[15px] font-bold ${f.currentProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{f.currentProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Site Health */}
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              Landscape Health
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                park.health.status === 'HEALTHY' ? 'bg-green-400/10 text-green-400' :
                park.health.status === 'ATTENTION' ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'
              }`}>{park.health.status}</span>
            </h3>

            <div className="space-y-3">
              <HealthBar label="Plants" value={park.health.plants} />
              <HealthBar label="Irrigation" value={park.health.irrigation} />
              <HealthBar label="Lawn" value={park.health.lawn} />
              <HealthBar label="Lighting" value={park.health.lighting} />
              <HealthBar label="Maintenance" value={park.health.maintenance} />
              
              <div className="pt-3 mt-3 border-t border-[#292B30]">
                <HealthBar label="Overall" value={park.health.overall} isOverall={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor = 'text-white' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-500 font-semibold">{label}</span>
      <span className={`text-[12px] font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}

function HealthBar({ label, value, isOverall = false }: { label: string; value: number; isOverall?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-[11px] w-20 ${isOverall ? 'font-bold text-white' : 'font-medium text-gray-400'}`}>{label}</span>
      <div className={`flex-1 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30] ${isOverall ? 'h-2' : 'h-1.5'}`}>
        <div 
          className={`h-full rounded-full transition-all ${
            value >= 90 ? 'bg-green-400' : value >= 70 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold w-8 text-right ${isOverall ? 'text-yellow-400' : 'text-white'}`}>{value}%</span>
    </div>
  );
}
