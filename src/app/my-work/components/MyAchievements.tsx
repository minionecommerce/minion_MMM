'use client';

import { Trophy, Star, ArrowRight, Target } from 'lucide-react';
import { useMyWork } from "../MyWorkContext";

export default function MyAchievements() {
  const { achievements } = useMyWork();

  const { currentValue, targetValue, progress, nextMilestone, level, badgesEarned, totalBadges } = achievements;

  return (
    <div className="bg-gradient-to-br from-[#1a1505] via-[#151619] to-[#0D0D0F] rounded-xl border border-yellow-400/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-yellow-400/10">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-[14px] font-bold text-white">My Achievements</span>
        </div>
        <p className="text-[12px] text-gray-500 pl-6">September Progress</p>
      </div>

      {/* Level Badge */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <div className="text-[11px] text-gray-500">Achievement Level</div>
              <div className="text-[15px] font-bold text-yellow-400">{level} Member</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500">Badges</div>
            <div className="text-[15px] font-bold text-white">{badgesEarned}/{totalBadges}</div>
          </div>
        </div>

        {/* Revenue Progress */}
        <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider">Current</div>
              <div className="text-[17px] font-bold text-white">{currentValue}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider">Target</div>
              <div className="text-[17px] font-bold text-yellow-400">{targetValue}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1e2025] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-yellow-400 font-bold">{progress}%</span>
            <span className="text-gray-600">Next: {nextMilestone}</span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: totalBadges }).map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                i < badgesEarned
                  ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                  : 'bg-[#1a1b1e] border-[#292B30] text-gray-700'
              }`}
            >
              <Star className={`w-3 h-3 ${i < badgesEarned ? 'fill-yellow-400' : ''}`} />
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 border border-yellow-400/30 hover:bg-yellow-400/5 text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg transition-all duration-200 active:scale-95">
          View Rewards
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
