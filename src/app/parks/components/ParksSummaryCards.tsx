'use client';

import { Trees, IndianRupee, Calendar, Droplets, Leaf, Activity } from 'lucide-react';

interface ParksSummaryCardsProps {
  landscapes?: any[];
}

export default function ParksSummaryCards({ landscapes = [] }: ParksSummaryCardsProps) {
  const totalLandscapes = landscapes.length;
  const onTrackCount = landscapes.filter(l => l.healthStatus === 'Healthy' || l.health >= 80).length;
  const attentionCount = landscapes.filter(l => l.healthStatus === 'Attention' || (l.health >= 60 && l.health < 80)).length;
  const criticalCount = landscapes.filter(l => l.healthStatus === 'Critical' || l.health < 60).length;

  const totalValue = landscapes.reduce((acc, l) => acc + Number(l.value || 0), 0);

  const totalMaintenanceDue = landscapes.reduce((acc, l) => acc + (l.maintenances?.length || 0), 0);
  const totalIrrigationSystems = landscapes.reduce((acc, l) => acc + (l.irrigationZones?.length || 0), 0);
  const totalPlantationTasks = landscapes.reduce((acc, l) => acc + (l.plants?.length || 0), 0);

  const avgHealth = totalLandscapes > 0
    ? Math.round(landscapes.reduce((acc, l) => acc + (l.health || 90), 0) / totalLandscapes)
    : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      title: 'ACTIVE LANDSCAPES',
      value: String(totalLandscapes).padStart(2, '0'),
      sub1: `${String(onTrackCount).padStart(2, '0')} On Track`,
      sub2: `${String(attentionCount).padStart(2, '0')} Attention`,
      sub3: `${String(criticalCount).padStart(2, '0')} Critical`,
      icon: Trees,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20'
    },
    {
      title: 'TOTAL LANDSCAPE VALUE',
      value: formatCurrency(totalValue),
      sub1: 'Active Projects',
      sub2: '',
      sub3: '',
      icon: IndianRupee,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20'
    },
    {
      title: 'MAINTENANCE DUE',
      value: String(totalMaintenanceDue).padStart(2, '0'),
      sub1: 'Across Landscapes',
      sub2: '',
      sub3: '',
      icon: Calendar,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 border-orange-400/20'
    },
    {
      title: 'IRRIGATION SYSTEMS',
      value: String(totalIrrigationSystems).padStart(2, '0'),
      sub1: `${String(totalIrrigationSystems).padStart(2, '0')} Active Zones`,
      sub2: '',
      sub3: '',
      icon: Droplets,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10 border-cyan-400/20'
    },
    {
      title: 'PLANTATION TASKS',
      value: String(totalPlantationTasks).padStart(2, '0'),
      sub1: 'Tracked Stock / Plants',
      sub2: '',
      sub3: '',
      icon: Leaf,
      color: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/20'
    },
    {
      title: 'SITE HEALTH',
      value: `${avgHealth}%`,
      sub1: 'Average Score',
      sub2: '',
      sub3: '',
      icon: Activity,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10 border-pink-400/20'
    }
  ];

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight w-2/3">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <div className="text-[22px] font-black text-white leading-none mb-2">{card.value}</div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[10px] font-semibold ${card.sub1.includes('On Track') || card.sub1.includes('Active') && !card.sub1.includes('Projects') ? 'text-green-400' : 'text-gray-400'}`}>{card.sub1}</span>
                  {card.sub2 && (
                    <span className={`text-[10px] font-semibold ${card.sub2.includes('Attention') ? 'text-amber-400' : 'text-gray-400'}`}>
                      {card.sub2}
                    </span>
                  )}
                  {card.sub3 && (
                    <span className={`text-[10px] font-semibold ${card.sub3.includes('Critical') ? 'text-red-400' : 'text-gray-400'}`}>{card.sub3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

