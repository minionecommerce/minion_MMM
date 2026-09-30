'use client';

import { Shield, Lock, Award, Star, Heart, Target, Flame, CheckCircle2 } from 'lucide-react';

interface BadgesTabProps {
  totalPoints: number;
  totalRevenue: number;
}

const BADGES = [
  { id: 'B1', title: 'GROWTH LEADER', desc: 'Earned 1,000+ points across achievements', icon: Award, reqType: 'points', reqValue: 1000, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { id: 'B2', title: 'REVENUE CHAMPION', desc: 'Achieved over ₹25 Lakhs revenue milestone', icon: Target, reqType: 'revenue', reqValue: 2500000, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  { id: 'B3', title: 'PEER SUPPORTER', desc: 'Active in giving and receiving peer recognitions', icon: Heart, reqType: 'points', reqValue: 250, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/30' },
  { id: 'B4', title: 'WELLNESS STAR', desc: 'Active participant in company wellness programs', icon: Flame, reqType: 'points', reqValue: 100, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { id: 'B5', title: '1 CRORE CLUB', desc: 'Achieved landmark ₹1 Crore revenue benchmark', icon: Shield, reqType: 'revenue', reqValue: 10000000, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  { id: 'B6', title: 'CENTURION', desc: 'Earned 500+ total achievement points', icon: Star, reqType: 'points', reqValue: 500, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
];

export default function BadgesTab({ totalPoints, totalRevenue }: BadgesTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Employee Achievement Badges</h2>
        <p className="text-[12px] text-gray-400">Badges are automatically unlocked when achievement thresholds are met</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGES.map(b => {
          const Icon = b.icon;
          const isUnlocked = b.reqType === 'points' ? totalPoints >= b.reqValue : totalRevenue >= b.reqValue;
          return (
            <div key={b.id} className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              isUnlocked ? 'bg-[#151619] border-gray-500 hover:border-yellow-400/50' : 'bg-[#111113]/60 border-[#292B30] opacity-70'
            }`}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isUnlocked ? b.bg : 'bg-[#1a1b1f] border-[#292B30]'}`}>
                    <Icon className={`w-6 h-6 ${isUnlocked ? b.color : 'text-gray-600'}`} />
                  </div>
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded uppercase">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <h3 className="text-[15px] font-bold text-white mb-1">{b.title}</h3>
                <p className="text-[12px] text-gray-400">{b.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#292B30] text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                <span>Threshold:</span>
                <span className="text-white">
                  {b.reqType === 'revenue' ? `₹${(b.reqValue / 100000).toFixed(0)}L Revenue` : `${b.reqValue} Points`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
