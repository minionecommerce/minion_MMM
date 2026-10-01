'use client';

import { RewardEmployee } from '../data/mock';
import { Award, Target, CheckCircle2, Gift } from 'lucide-react';

export default function MyRewardsHero({ employee }: { employee: RewardEmployee }) {
  const progressPercent = (employee.currentRevenue / employee.nextMilestoneTarget) * 100;
  const remaining = employee.nextMilestoneTarget - employee.currentRevenue;

  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col xl:flex-row gap-8 relative z-10">
        
        {/* Left: Profile & Points */}
        <div className="flex items-center gap-6 xl:w-1/3 xl:border-r border-[#292B30] xl:pr-8">
          <div className="w-24 h-24 rounded-full bg-[#111113] border-2 border-yellow-400 flex items-center justify-center text-[32px] font-black text-yellow-400 shrink-0 shadow-[0_0_20px_rgba(255,196,0,0.15)]">
            {employee.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[20px] font-black text-white leading-tight uppercase tracking-wide">{employee.name}</h2>
            <div className="text-[12px] font-semibold text-gray-400 mb-2">{employee.designation}</div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Level:</span>
              <span className="text-[10px] font-black bg-purple-400/10 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded uppercase tracking-widest">
                {employee.level}
              </span>
            </div>
            
            <div className="mt-4 flex items-end gap-2">
              <Award className="w-6 h-6 text-yellow-400 mb-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Achievement Points</span>
                <span className="text-[28px] font-black text-yellow-400 leading-none">{employee.points.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Milestone Progress */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-end justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-[14px] font-bold text-white uppercase tracking-wider">Next Milestone: {employee.nextMilestoneName}</span>
            </div>
            <span className="text-[16px] font-black text-white">{progressPercent.toFixed(1)}%</span>
          </div>

          <div className="w-full h-3 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30] mb-3">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-gray-400">
              Current: <span className="text-white">₹{employee.currentRevenue.toLocaleString('en-IN')}</span>
            </span>
            <span className="font-bold text-gray-400">
              Target: <span className="text-white">₹{employee.nextMilestoneTarget.toLocaleString('en-IN')}</span>
            </span>
          </div>

          <div className="mt-6 bg-yellow-400/5 border border-yellow-400/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Next Reward</div>
                <div className="text-[13px] font-bold text-yellow-400">{employee.nextMilestoneReward}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-white">₹{remaining.toLocaleString('en-IN')}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remaining to unlock</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
