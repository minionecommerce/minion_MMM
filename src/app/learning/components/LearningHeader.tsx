'use client';

import { BookOpen, Calendar, GraduationCap, Clock, Plus, Target } from 'lucide-react';

export default function LearningHeader() {
  return (
    <div className="px-6 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-white">LEARNING</h1>
        </div>
        <p className="text-[13px] text-gray-400 max-w-xl font-medium">
          Learn, improve and grow with Minion.
          <br className="hidden sm:block" />
          <span className="text-gray-500">Build technical, professional and leadership skills through structured learning and practical experience.</span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all">
          <BookOpen className="w-3.5 h-3.5" />
          My Learning
        </button>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] bg-[#151619] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white transition-all">
          <Calendar className="w-3.5 h-3.5" />
          Learning Calendar
        </button>
        
        <div className="w-px h-6 bg-[#292B30] mx-1 hidden lg:block" />
        
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-blue-400/50 text-[12px] font-semibold text-gray-300 hover:text-blue-400 transition-all">
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Assign Learning</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-green-400/50 text-[12px] font-semibold text-gray-300 hover:text-green-400 transition-all">
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Schedule Session</span>
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-[12px] font-bold text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)]">
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </div>
    </div>
  );
}
