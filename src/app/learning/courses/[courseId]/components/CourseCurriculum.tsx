'use client';

import { Course } from '../../../data/mock';
import { PlayCircle, FileText, CheckSquare, Lock, PenTool } from 'lucide-react';
import Link from 'next/link';

interface CourseCurriculumProps {
  course: Course;
}

export default function CourseCurriculum({ course }: CourseCurriculumProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Course Curriculum</h2>
      
      <div className="space-y-4">
        {course.modules.map((mod, index) => (
          <div key={mod.id} className={`bg-[#151619] border ${mod.locked ? 'border-[#292B30] opacity-60' : 'border-[#292B30]'} rounded-xl overflow-hidden`}>
            
            {/* Module Header */}
            <div className="px-6 py-4 bg-[#111113] border-b border-[#292B30] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black ${
                  mod.completed ? 'bg-green-400/10 text-green-400' :
                  mod.locked ? 'bg-gray-500/10 text-gray-500' :
                  'bg-yellow-400/10 text-yellow-400'
                }`}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Module {index + 1}</span>
                  <h3 className="text-[14px] font-bold text-white">{mod.title}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {mod.locked ? (
                  <Lock className="w-4 h-4 text-gray-600" />
                ) : mod.completed ? (
                  <CheckSquare className="w-5 h-5 text-green-400" />
                ) : null}
              </div>
            </div>

            {/* Lessons */}
            <div className="divide-y divide-[#292B30]">
              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#1a1b1f] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-500">
                      {lesson.type === 'Video' ? <PlayCircle className="w-4 h-4" /> :
                       lesson.type === 'Quiz' ? <CheckSquare className="w-4 h-4" /> :
                       lesson.type === 'Practical' ? <PenTool className="w-4 h-4" /> :
                       <FileText className="w-4 h-4" />}
                    </div>
                    <span className={`text-[13px] font-bold ${
                      mod.locked ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {lesson.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <span className="text-[11px] font-medium text-gray-500">{lesson.durationMinutes} min</span>
                    {lesson.completed ? (
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded">
                        Completed
                      </span>
                    ) : mod.locked ? (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded">
                        Locked
                      </span>
                    ) : (
                      <button className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors border border-yellow-400/30 px-3 py-1 rounded">
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}

        {course.modules.length === 0 && (
          <div className="text-center py-12 text-gray-600 bg-[#151619] rounded-xl border border-[#292B30]">
            <div className="text-3xl mb-3 opacity-50">📚</div>
            <div className="text-[14px] font-bold text-white mb-1">Curriculum building in progress</div>
            <div className="text-[12px]">Modules and lessons will appear here once published.</div>
          </div>
        )}
      </div>
    </div>
  );
}
