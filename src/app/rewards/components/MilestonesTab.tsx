'use client';

import { Target, CheckCircle2, Lock, Bike, Car, ArrowRight, ShieldCheck } from 'lucide-react';

interface MilestonesTabProps {
  totalRevenueValue: number;
  onOpenCreate: () => void;
}

const MILESTONE_TIERS = [
  { id: 'M5L', threshold: 500000, label: '₹5 LAKHS', reward: 'Token of Appreciation', icon: 'Token' },
  { id: 'M10L', threshold: 1000000, label: '₹10 LAKHS', reward: 'Dinner Experience with Family', icon: 'Dinner' },
  { id: 'M12L', threshold: 1200000, label: '₹12 LAKHS', reward: 'Gym & Wellness Support', icon: 'Gym' },
  { id: 'M18L', threshold: 1800000, label: '₹18 LAKHS', reward: 'Wellness Activity - Company Support', icon: 'Wellness' },
  { id: 'M22L', threshold: 2200000, label: '₹22 LAKHS', reward: 'Bike Incentive Eligibility', icon: 'Bike' },
  { id: 'M25L', threshold: 2500000, label: '₹25 LAKHS', reward: 'Family India Trip', icon: 'Trip' },
  { id: 'M50L', threshold: 5000000, label: '₹50 LAKHS', reward: 'Family Trip / Wellness Lifestyle Experience', icon: 'Luxury' },
  { id: 'M1CR', threshold: 10000000, label: '₹1 CRORE', reward: 'Family International Trip / Car Eligibility', icon: 'Car' },
];

export default function MilestonesTab({ totalRevenueValue, onOpenCreate }: MilestonesTabProps) {
  // Find current active milestone
  let currentMilestone = MILESTONE_TIERS[0];
  let nextMilestone = MILESTONE_TIERS[1];

  for (let i = 0; i < MILESTONE_TIERS.length; i++) {
    if (totalRevenueValue >= MILESTONE_TIERS[i].threshold) {
      currentMilestone = MILESTONE_TIERS[i];
      nextMilestone = MILESTONE_TIERS[i + 1] || MILESTONE_TIERS[i];
    }
  }

  const nextProgress = Math.min(100, (totalRevenueValue / nextMilestone.threshold) * 100);
  const remainingValue = Math.max(0, nextMilestone.threshold - totalRevenueValue);

  const bikeEligible = totalRevenueValue >= 2200000;
  const carEligible = totalRevenueValue >= 10000000;

  return (
    <div className="space-y-8">
      {/* Milestone Overview Banner */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-yellow-400" />
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Business Revenue Basis</span>
            </div>
            <h2 className="text-[24px] font-black text-white">₹{totalRevenueValue.toLocaleString('en-IN')} Realized</h2>
            <p className="text-[12px] text-gray-400">Calculated directly from confirmed CRM deals</p>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="flex justify-between items-center text-[12px] font-bold text-gray-300 mb-2">
              <span>Next Target: {nextMilestone.label}</span>
              <span className="text-yellow-400 font-black">{nextProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-[#0D0D0F] border border-[#292B30] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700"
                style={{ width: `${nextProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-medium text-gray-500 mt-2">
              <span>Current: ₹{totalRevenueValue.toLocaleString('en-IN')}</span>
              <span>Remaining: ₹{remainingValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Major Eligibility Cards: Bike & Car */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bike Eligibility */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
          bikeEligible 
            ? 'bg-gradient-to-br from-[#151619] to-green-950/20 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
            : 'bg-[#151619] border-[#292B30]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <Bike className="w-6 h-6 text-blue-400" />
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                bikeEligible ? 'bg-green-400/10 text-green-400 border-green-400/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {bikeEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </span>
            </div>

            <h3 className="text-[18px] font-black text-white mb-1">BIKE REWARD INCENTIVE</h3>
            <p className="text-[12px] text-gray-400 mb-4">Minimum ₹22 Lakhs revenue achievement + verified participation & impact points required.</p>

            <div className="space-y-2 text-[12px] text-gray-300 border-t border-[#292B30] pt-4">
              <div className="flex items-center justify-between">
                <span>Revenue Required: ₹22,00,000</span>
                <span className={totalRevenueValue >= 2200000 ? 'text-green-400 font-bold' : 'text-gray-500'}>
                  {totalRevenueValue >= 2200000 ? '✓ Reached' : `₹${Math.max(0, 2200000 - totalRevenueValue).toLocaleString('en-IN')} left`}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={!bikeEligible}
            className={`w-full mt-6 py-2.5 rounded-lg font-bold text-[12px] transition-all ${
              bikeEligible 
                ? 'bg-blue-400 text-black hover:bg-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.3)]' 
                : 'bg-[#111113] border border-[#292B30] text-gray-500 cursor-not-allowed'
            }`}
          >
            {bikeEligible ? 'Claim Bike Reward Review' : 'Requirements Pending'}
          </button>
        </div>

        {/* Car Eligibility */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
          carEligible 
            ? 'bg-gradient-to-br from-[#151619] to-yellow-950/20 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
            : 'bg-[#151619] border-[#292B30]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <Car className="w-6 h-6 text-yellow-400" />
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                carEligible ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {carEligible ? 'ELIGIBLE' : 'LOCKED'}
              </span>
            </div>

            <h3 className="text-[18px] font-black text-white mb-1">CAR REWARD INCENTIVE</h3>
            <p className="text-[12px] text-gray-400 mb-4">₹1 Crore revenue achievement + quarterly strategy & leadership milestones.</p>

            <div className="space-y-2 text-[12px] text-gray-300 border-t border-[#292B30] pt-4">
              <div className="flex items-center justify-between">
                <span>Revenue Required: ₹1,00,00,000</span>
                <span className={totalRevenueValue >= 10000000 ? 'text-yellow-400 font-bold' : 'text-gray-500'}>
                  {totalRevenueValue >= 10000000 ? '✓ Reached' : `₹${Math.max(0, 10000000 - totalRevenueValue).toLocaleString('en-IN')} left`}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={!carEligible}
            className={`w-full mt-6 py-2.5 rounded-lg font-bold text-[12px] transition-all ${
              carEligible 
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(255,196,0,0.3)]' 
                : 'bg-[#111113] border border-[#292B30] text-gray-500 cursor-not-allowed'
            }`}
          >
            {carEligible ? 'Claim Car Incentive' : 'Requirements Pending'}
          </button>
        </div>
      </div>

      {/* Revenue Milestones Grid */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <h2 className="text-[15px] font-bold text-white uppercase tracking-wide mb-6">Revenue Achievement Tiers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MILESTONE_TIERS.map(tier => {
            const isUnlocked = totalRevenueValue >= tier.threshold;
            return (
              <div key={tier.id} className={`p-4 rounded-xl border flex flex-col justify-between ${
                isUnlocked ? 'bg-[#111113] border-yellow-400/30' : 'bg-[#111113]/50 border-[#292B30] opacity-80'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[14px] font-black ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {tier.label}
                    </span>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-white mb-2">{tier.reward}</p>
                </div>

                <div className="pt-3 border-t border-[#292B30] text-[10px] font-bold uppercase tracking-wider flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={isUnlocked ? 'text-green-400' : 'text-gray-500'}>
                    {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
