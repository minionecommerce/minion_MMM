'use client';

import { Star, Trophy, Target, Gift, Users, Clock } from 'lucide-react';

interface RewardsSummaryCardsProps {
  initialData?: any;
  onCardClick?: (title: string) => void;
}

export default function RewardsSummaryCards({ initialData = {}, onCardClick }: RewardsSummaryCardsProps) {
  const ledgers = initialData.ledgers || [];
  const rewards = initialData.rewards || [];
  
  const myPoints = ledgers.reduce((acc: number, l: any) => acc + (l.points || 0), 0);
  const achievementsCount = rewards.length;
  const rewardsEarnedCount = rewards.filter((r: any) => r.points > 0).length;

  const cards = [
    { title: 'MY POINTS', value: myPoints.toLocaleString('en-IN'), icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    { title: 'MY ACHIEVEMENTS', value: String(achievementsCount).padStart(2, '0'), icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
    { title: 'CURRENT MILESTONE', value: '₹25L Milestone', icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { title: 'REWARDS EARNED', value: String(rewardsEarnedCount).padStart(2, '0'), icon: Gift, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    { title: 'TEAM RECOGNITIONS', value: String(ledgers.filter((l: any) => l.category === 'Recognition').length || 0).padStart(2, '0'), icon: Users, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
    { title: 'PENDING REWARDS', value: '00', icon: Clock, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' }
  ];

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              onClick={() => onCardClick?.(card.title)}
              className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight max-w-[70%]">{card.title}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-[20px] font-black text-white leading-none truncate">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

