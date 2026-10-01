'use client';

import { Trophy, Award, User, Star, ShieldCheck } from 'lucide-react';

interface LeaderboardTabProps {
  employees: any[];
  ledgers: any[];
  rewards: any[];
}

export default function LeaderboardTab({ employees, ledgers, rewards }: LeaderboardTabProps) {
  // Aggregate points per employee
  const leaderboardData = employees.map(emp => {
    const empLedgers = ledgers.filter((l: any) => l.employeeId === emp.id);
    const empRewards = rewards.filter((r: any) => r.employeeId === emp.id);
    const netPoints = empLedgers.reduce((acc: number, l: any) => acc + (l.points || 0), 0);
    const empName = emp.user?.name || emp.designation || 'Employee';

    return {
      id: emp.id,
      name: empName,
      designation: emp.designation || 'Team Member',
      department: emp.departmentRef?.name || 'General',
      netPoints,
      achievementsCount: empRewards.length,
    };
  }).sort((a, b) => b.netPoints - a.netPoints);

  return (
    <div className="space-y-6">
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Company Rewards Leaderboard</h2>
          <p className="text-[12px] text-gray-400">Real-time rankings based on cumulative points ledger entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-[12px] font-bold text-yellow-400 uppercase tracking-widest">Live Standings</span>
        </div>
      </div>

      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        {leaderboardData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-white">No employee leaderboard entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] border-b border-[#292B30] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Achievements</th>
                  <th className="py-3.5 px-4 text-right">Net Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]/50 text-[13px]">
                {leaderboardData.map((item, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                  
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-center font-black text-[14px]">
                        <span className={isTop3 ? 'text-[18px]' : 'text-gray-500 font-mono text-[12px]'}>
                          {rankBadge}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] border ${
                            rank === 1 ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' :
                            rank === 2 ? 'bg-gray-300/20 border-gray-300 text-gray-200' :
                            rank === 3 ? 'bg-amber-600/20 border-amber-600 text-amber-500' :
                            'bg-[#0D0D0F] border-[#292B30] text-gray-400'
                          }`}>
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white leading-tight uppercase">{item.name}</div>
                            <div className="text-[11px] font-semibold text-gray-400">{item.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-[#0D0D0F] border border-[#292B30] px-2.5 py-1 rounded text-[10px] font-bold text-gray-300 uppercase">
                          {item.department}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-gray-300">
                        {item.achievementsCount}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[16px] font-black text-yellow-400 leading-none">
                          {item.netPoints.toLocaleString('en-IN')} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
