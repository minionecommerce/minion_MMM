'use client';

import { Flame, Plus, Calendar, CheckCircle2, User, HeartPulse, Activity, Dumbbell, Music, Palette } from 'lucide-react';

interface WellnessTabProps {
  ledgers: any[];
  employees: any[];
  onOpenSubmit: () => void;
}

const WELLNESS_PROGRAMS = [
  { id: 'WP1', title: 'Fitness & Sports', desc: 'Gym, Yoga, Swimming, Running, Sports Training', icon: Dumbbell, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { id: 'WP2', title: 'Dance & Movement', desc: 'Zumba, Classical, Western Dance, Dance Workshops', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { id: 'WP3', title: 'Music & Performing Arts', desc: 'Singing, Musical Instruments, Music Classes, Theatre', icon: Music, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'WP4', title: 'Creative Arts', desc: 'Drawing, Painting, Photography, Craft & Design', icon: Palette, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
  { id: 'WP5', title: 'Wellness & Mindfulness', desc: 'Meditation, Stress Management, Life Coaching', icon: HeartPulse, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
];

export default function WellnessTab({ ledgers, employees, onOpenSubmit }: WellnessTabProps) {
  const wellnessEntries = ledgers.filter((l: any) => l.category === 'Wellness' || l.source === 'Wellness Program');

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Employee Health & Wellness Benefits</h2>
          <p className="text-[12px] text-gray-400">Company-supported reimbursement & encouragement for physical & mental wellbeing</p>
        </div>
        <button
          onClick={onOpenSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-orange-400 hover:bg-orange-300 text-black text-[12px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(251,146,60,0.15)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Claim Wellness Benefit
        </button>
      </div>

      {/* Wellness Program Categories */}
      <div>
        <h3 className="text-[14px] font-bold text-white uppercase tracking-wide mb-4">Supported Wellness Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {WELLNESS_PROGRAMS.map(prog => {
            const Icon = prog.icon;
            return (
              <div key={prog.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors">
                <div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border mb-3 ${prog.bg}`}>
                    <Icon className={`w-4 h-4 ${prog.color}`} />
                  </div>
                  <h4 className="text-[13px] font-bold text-white mb-1">{prog.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-snug">{prog.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim History */}
      <div>
        <h3 className="text-[14px] font-bold text-white uppercase tracking-wide mb-4">Logged Wellness Claims</h3>

        {wellnessEntries.length === 0 ? (
          <div className="text-center py-12 bg-[#151619] border border-[#292B30] rounded-xl">
            <Flame className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-[13px] font-bold text-white">No wellness benefit claims recorded yet</p>
            <button
              onClick={onOpenSubmit}
              className="mt-3 px-4 py-2 bg-orange-400 text-black font-bold text-[12px] rounded-lg"
            >
              Submit Claim
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wellnessEntries.map((w: any) => {
              const empName = w.employee?.user?.name || w.employee?.designation || 'Employee';
              return (
                <div key={w.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Wellness Benefit</span>
                      </div>
                      <span className="text-[12px] font-black text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2.5 py-0.5 rounded">
                        +{w.points} PTS
                      </span>
                    </div>

                    <h3 className="text-[14px] font-bold text-white mb-2 leading-snug">{w.description}</h3>
                    
                    <div className="flex items-center gap-2 text-[12px] text-gray-300 mb-4">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-semibold">{empName}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#292B30] flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
