'use client';

import { Course, Session, SkillProgress } from '../data/mock';
import { BookOpen, Users, Star, Clock, PlayCircle, FileText, ChevronRight, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface MyLearningProps {
  courses: Course[];
  sessions: Session[];
  skills: SkillProgress[];
}

export default function MyLearning({ courses, sessions, skills }: MyLearningProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Left Column (Courses & Skills) */}
      <div className="xl:col-span-2 space-y-8">
        
        {/* Enrolled Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">In Progress</h2>
            </div>
            <Link href="#" className="text-[11px] font-bold text-gray-500 hover:text-yellow-400 transition-colors">View All Courses</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.filter(c => c.status === 'In Progress').map(course => (
              <div key={course.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-[#0D0D0F] border border-[#292B30] px-2 py-1 rounded">
                    {course.category}
                  </span>
                  {course.dueDate && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                      Due: {new Date(course.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                
                <h3 className="text-[16px] font-bold text-white mb-4 line-clamp-2">{course.name}</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
                    <Clock className="w-3 h-3 text-gray-500" /> {course.durationHours} Hours
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
                    <FileText className="w-3 h-3 text-gray-500" /> {course.totalLessons} Lessons
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Progress</span>
                    <span className="text-[12px] font-bold text-white">{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>

                <Link href={`/learning/courses/${course.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0D0D0F] border border-[#292B30] hover:border-yellow-400/50 rounded-lg text-[11px] font-bold text-yellow-400 transition-colors mt-auto">
                  <PlayCircle className="w-3.5 h-3.5" /> Continue Learning
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Progress */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Skill Progress</h2>
          </div>
          
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills.map(skill => (
                <div key={skill.name} className="flex flex-col">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[13px] font-bold text-white">{skill.name}</span>
                    <span className="text-[11px] font-bold text-purple-400">{skill.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30] mb-2">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${skill.progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Current: {skill.level}</span>
                    <span>Target: {skill.targetLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column (Sessions) */}
      <div className="space-y-8">
        
        {/* Upcoming Sessions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-orange-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Upcoming Sessions</h2>
          </div>
          
          <div className="space-y-3">
            {sessions.filter(s => s.status === 'Scheduled').map(session => {
              const sessionDate = new Date(session.date);
              const isToday = new Date().toDateString() === sessionDate.toDateString();

              return (
                <div key={session.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className={`text-[12px] font-bold ${isToday ? 'text-amber-400' : 'text-gray-300'}`}>
                        {isToday ? 'Today' : sessionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">{session.time}</span>
                    </div>
                    {session.mandatory && (
                      <span className="text-[9px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Mandatory
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-[14px] font-bold text-white mb-1 leading-tight">{session.name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium mb-4">{session.topic}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center text-[9px] font-bold text-gray-300">
                      {session.trainer.charAt(0)}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">By {session.trainer}</span>
                  </div>

                  <button className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-bold rounded-lg transition-colors">
                    Join Session
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently Completed */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-green-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Recently Completed</h2>
          </div>
          
          <div className="space-y-3">
            {courses.filter(c => c.status === 'Completed').map(course => (
              <div key={course.id} className="flex items-center gap-3 bg-[#151619] border border-[#292B30] rounded-xl p-3">
                <div className="w-10 h-10 rounded bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-white truncate">{course.name}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{course.category}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            ))}
            {sessions.filter(s => s.status === 'Completed').map(session => (
              <div key={session.id} className="flex items-center gap-3 bg-[#151619] border border-[#292B30] rounded-xl p-3">
                <div className="w-10 h-10 rounded bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-white truncate">{session.name}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
