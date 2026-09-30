'use client';

import { Milestone, EligibilityCriterion } from '../data/mock';
import { CheckCircle2, Lock, Gift, ArrowRight } from 'lucide-react';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  eligibility: EligibilityCriterion[];
  onRequestReview?: () => void;
}

export default function MilestoneTimeline({ milestones, eligibility, onRequestReview }: MilestoneTimelineProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Timeline Column */}
      <div className="xl:col-span-2 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <h2 className="text-[14px] font-bold text-white uppercase tracking-wide mb-8">Achievement Timeline</h2>
        
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#292B30] before:via-yellow-400/20 before:to-[#292B30]">
          
          {milestones.map((ms, idx) => (
            <div key={ms.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
              
              {/* Marker */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#151619] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10 ${
                ms.status === 'Completed' ? 'bg-yellow-400' :
                ms.status === 'In Progress' ? 'bg-blue-500' :
                'bg-[#292B30]'
              }`}>
                {ms.status === 'Completed' ? <CheckCircle2 className="w-4 h-4 text-black" /> :
                 ms.status === 'In Progress' ? <ArrowRight className="w-4 h-4 text-white" /> :
                 <Lock className="w-4 h-4 text-gray-500" />}
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#111113] p-5 rounded-xl border border-[#292B30] group-hover:border-gray-500 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[12px] font-black tracking-widest uppercase ${
                    ms.status === 'Completed' ? 'text-yellow-400' :
                    ms.status === 'In Progress' ? 'text-blue-400' :
                    'text-gray-500'
                  }`}>
                    {ms.targetLabel}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                    ms.status === 'Completed' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                    ms.status === 'In Progress' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  }`}>
                    {ms.status}
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-[#151619] border border-[#292B30] flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reward</span>
                    <span className="text-[12px] font-bold text-white leading-tight mt-0.5">{ms.rewardName}</span>
                  </div>
                </div>

                {ms.status === 'Completed' && ms.achievedDate && (
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-t border-[#292B30] pt-3">
                    Achieved: <span className="text-white">{ms.achievedDate}</span>
                  </div>
                )}

                {ms.status === 'In Progress' && (
                  <div className="border-t border-[#292B30] pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {((ms.currentProgress / ms.targetAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0D0D0F] border border-[#292B30] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(ms.currentProgress / ms.targetAmount) * 100}%` }} />
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 mt-2 text-center">
                      Remaining: <span className="text-white">₹{ms.remaining.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {/* Eligibility Column */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 h-fit sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Current Eligibility</h2>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">₹25L MILESTONE</span>
        </div>

        <p className="text-[11px] text-gray-400 font-medium mb-6">
          You must meet all configured criteria below to unlock your next reward. 
          Management review is required once eligible.
        </p>

        <div className="space-y-3">
          {eligibility.map(crit => (
            <div key={crit.id} className="flex items-center justify-between p-3 bg-[#111113] border border-[#292B30] rounded-lg">
              <div className="flex items-center gap-3">
                {crit.status === 'Completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#292B30] shrink-0" />
                )}
                <span className={`text-[12px] font-bold ${crit.status === 'Completed' ? 'text-white' : 'text-gray-400'}`}>
                  {crit.name}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded bg-[#0D0D0F] border ${
                crit.status === 'Completed' ? 'text-green-400 border-green-400/20' : 'text-gray-500 border-[#292B30]'
              }`}>
                {crit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#292B30]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-bold text-gray-400">Overall Status</span>
            <span className="text-[12px] font-black text-green-400 uppercase tracking-widest">Eligible For Review</span>
          </div>
          <button 
            onClick={onRequestReview}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black text-[11px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)] cursor-pointer"
          >
            Request Review
          </button>
        </div>
      </div>

    </div>
  );
}

