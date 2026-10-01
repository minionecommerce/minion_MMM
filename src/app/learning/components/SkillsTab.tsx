'use client';

import { Activity, Target, Zap, ChevronRight } from 'lucide-react';
import { SkillProgress } from '../data/mock';

interface SkillsTabProps {
  skills: SkillProgress[];
}

export default function SkillsTab({ skills }: SkillsTabProps) {
  // Sort by gap to target
  const difficultyToLevel: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
  const sortedSkills = [...skills].sort((a, b) => {
    const gapA = difficultyToLevel[a.targetLevel] - difficultyToLevel[a.level];
    const gapB = difficultyToLevel[b.targetLevel] - difficultyToLevel[b.level];
    return gapB - gapA;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-[20px] font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Skills Matrix & Goals
          </h2>
          <p className="text-[12px] text-gray-400 mt-2 max-w-lg leading-relaxed">
            Track your proficiency across core competencies. Identify gaps and focus your learning to reach your target skill levels.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0D0D0F] border border-[#292B30] p-4 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-[24px] font-black text-purple-400">{skills.filter(s => difficultyToLevel[s.level] >= difficultyToLevel[s.targetLevel]).length}</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Targets Hit</span>
          </div>
          <div className="w-px h-8 bg-[#292B30]" />
          <div className="flex flex-col items-center">
            <span className="text-[24px] font-black text-white">{skills.length}</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Skills</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Skill Gaps Focus */}
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl p-6">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-yellow-400" /> Focus Areas (Largest Gaps)
          </h3>
          
          <div className="space-y-6">
            {sortedSkills.map((skill, idx) => {
              const gap = difficultyToLevel[skill.targetLevel] - difficultyToLevel[skill.level];
              const isTargetHit = gap <= 0;
              
              return (
                <div key={skill.name} className="group flex flex-col relative" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-white group-hover:text-purple-400 transition-colors">{skill.name}</span>
                      {isTargetHit && <span className="bg-green-400/10 text-green-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-green-400/20">Target Met</span>}
                    </div>
                    <span className="text-[12px] font-bold text-purple-400">{skill.progress}% <span className="text-gray-600 text-[10px]">proficient</span></span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full h-2.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30] relative mb-2">
                    <div 
                      className={`h-full ${isTargetHit ? 'bg-green-400' : 'bg-purple-500'} rounded-full transition-all duration-1000`} 
                      style={{ width: `${skill.progress}%` }} 
                    />
                    {/* Target Marker (visual indicator) */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10" 
                      style={{ left: `${(difficultyToLevel[skill.targetLevel] / 5) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Lvl {skill.level} (Current)</span>
                    <span className="text-white">Lvl {skill.targetLevel} (Target)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Suggested Courses for Skills */}
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl p-6 flex flex-col">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-blue-400" /> Recommended Actions
          </h3>

          <div className="flex-1 space-y-4">
            {sortedSkills.filter(s => difficultyToLevel[s.targetLevel] > difficultyToLevel[s.level]).slice(0, 3).map(skill => (
              <div key={`rec-${skill.name}`} className="bg-[#0D0D0F] border border-[#292B30] rounded-xl p-4 hover:border-purple-400/50 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Bridge the gap: {skill.name}</div>
                    <h4 className="text-[14px] font-bold text-white mb-2 leading-tight group-hover:text-purple-400 transition-colors">Advanced {skill.name} Techniques</h4>
                    <p className="text-[11px] text-gray-400">Enroll in this curated course to reach Level {skill.targetLevel} proficiency in {skill.name}.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#151619] border border-[#292B30] flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-all text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {sortedSkills.filter(s => difficultyToLevel[s.targetLevel] > difficultyToLevel[s.level]).length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#292B30] rounded-xl">
                <div className="w-12 h-12 rounded-full bg-green-400/10 text-green-400 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-[14px] font-bold text-white mb-2">All Targets Met!</h4>
                <p className="text-[12px] text-gray-400">You have achieved all current skill proficiency targets. Speak with your manager to set new goals.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
