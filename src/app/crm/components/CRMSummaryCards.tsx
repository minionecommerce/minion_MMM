'use client';

import { Users, UserPlus, Phone, MapPin, Handshake, Trophy } from 'lucide-react';

interface CRMSummaryCardsProps {
  stats: {
    totalLeads: number;
    newLeads: number;
    followUps: { total: number; dueToday: number };
    siteVisits: { upcoming: number };
    activeDeals: { count: number; pipeline: number };
    wonThisMonth: { count: number; value: number };
  };
  onCardClick?: (card: string) => void;
}

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export default function CRMSummaryCards({ stats, onCardClick }: CRMSummaryCardsProps) {
  const cards = [
    {
      id: 'TOTAL_LEADS',
      label: 'TOTAL LEADS',
      value: stats.totalLeads,
      sub: `${stats.newLeads} New`,
      icon: Users,
      subColor: 'text-green-400',
      accent: false,
    },
    {
      id: 'NEW_LEADS',
      label: 'NEW LEADS',
      value: stats.newLeads,
      sub: 'Uncontacted',
      icon: UserPlus,
      subColor: 'text-yellow-400',
      accent: false,
    },
    {
      id: 'FOLLOW_UPS',
      label: 'FOLLOW-UPS',
      value: stats.followUps.total,
      sub: `${stats.followUps.dueToday} Due Today`,
      icon: Phone,
      subColor: stats.followUps.dueToday > 0 ? 'text-orange-400' : 'text-gray-400',
      accent: false,
    },
    {
      id: 'SITE_VISITS',
      label: 'SITE VISITS',
      value: String(stats.siteVisits.upcoming).padStart(2, '0'),
      sub: 'Upcoming',
      icon: MapPin,
      subColor: 'text-blue-400',
      accent: false,
    },
    {
      id: 'ACTIVE_DEALS',
      label: 'ACTIVE DEALS',
      value: stats.activeDeals.count,
      sub: `${formatCurrency(stats.activeDeals.pipeline)} Pipeline`,
      icon: Handshake,
      subColor: 'text-purple-400',
      accent: false,
    },
    {
      id: 'WON_THIS_MONTH',
      label: 'WON THIS MONTH',
      value: stats.wonThisMonth.count,
      sub: formatCurrency(stats.wonThisMonth.value),
      icon: Trophy,
      subColor: 'text-green-400',
      accent: true,
    },
  ];

  return (
    <div className="px-6 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => onCardClick?.(card.id)}
              className={`rounded-xl p-4 shadow-sm cursor-pointer group hover:-translate-y-0.5 transition-all duration-200 ${
                card.accent
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white text-black'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  card.accent
                    ? 'bg-black/10'
                    : 'bg-black group-hover:bg-yellow-400'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${
                    card.accent ? 'text-black' : 'text-white group-hover:text-black'
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider text-right leading-tight ${
                  card.accent ? 'text-black/60' : 'text-gray-400'
                }`}>
                  {card.label}
                </span>
              </div>
              <div className={`text-3xl font-bold leading-none mb-1 ${card.accent ? 'text-black' : 'text-black'}`}>
                {card.value}
              </div>
              <div className={`text-[11px] font-semibold ${card.accent ? 'text-black/70' : card.subColor}`}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
