'use client';

import { useState } from 'react';
import { Trophy, Gift, Award, Plus, Calendar, User } from 'lucide-react';
import { claimReward } from '../actions';

interface AchievementsTabProps {
  rewards: any[];
  employees: any[];
  onOpenCreate: () => void;
}

export default function AchievementsTab({ rewards, employees, onOpenCreate }: AchievementsTabProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (reward: any) => {
    setClaimingId(reward.id);
    const res = await claimReward(reward.reason, reward.points);
    setClaimingId(null);
    if (res.success) {
      alert(`Claim requested for ${reward.reason}!`);
      window.location.reload();
    } else {
      alert(res.error || 'Failed to claim reward');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Unlocked & Available Achievements</h2>
          <p className="text-[12px] text-gray-400">Total {rewards.length} achievements registered in the system</p>
        </div>
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(255,196,0,0.15)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Achievement
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-16 bg-[#151619] border border-[#292B30] rounded-xl">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-[14px]">No achievements recorded yet</h3>
          <p className="text-gray-500 text-[12px] mt-1 mb-4">Click below to unlock the first achievement for an employee.</p>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-yellow-400 text-black font-bold text-[12px] rounded-lg"
          >
            Create Achievement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((rw: any) => {
            const empName = rw.employee?.user?.name || rw.employee?.designation || 'Employee';
            return (
              <div key={rw.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Achievement</span>
                    </div>
                    <span className="text-[12px] font-black text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-0.5 rounded">
                      +{rw.points} PTS
                    </span>
                  </div>

                  <h3 className="text-[14px] font-bold text-white mb-2 leading-snug">{rw.reason}</h3>
                  
                  <div className="flex items-center gap-2 text-[12px] text-gray-300 mb-4">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-semibold">{empName}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                    <Calendar className="w-3 h-3" />
                    {new Date(rw.date || rw.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleClaim(rw)}
                    disabled={claimingId === rw.id}
                    className="px-3 py-1.5 bg-[#0D0D0F] border border-[#292B30] hover:border-green-400/50 text-[11px] font-bold text-green-400 rounded transition-all disabled:opacity-50"
                  >
                    {claimingId === rw.id ? 'Claiming...' : 'Claim Reward'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
