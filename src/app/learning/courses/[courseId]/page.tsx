'use client';

import { useParams } from 'next/navigation';

import CourseHeader from './components/CourseHeader';
import CourseCurriculum from './components/CourseCurriculum';
import { mockCourses } from '../../data/mock';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Star, UserCheck } from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const course = mockCourses.find(c => c.id === courseId);

  if (!course) {
    return (
      <div className="w-full min-h-screen bg-[#0D0D0F] text-white flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-[20px] font-bold mb-2">Course Not Found</h1>
        <p className="text-[14px] text-gray-500 mb-6">The requested course does not exist.</p>
        <Link href="/learning" className="px-6 py-2 bg-[#151619] border border-[#292B30] hover:border-yellow-400/50 rounded-lg text-[12px] font-bold text-yellow-400 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto pb-12">
        <CourseHeader course={course} />

        <div className="px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column (Curriculum) */}
            <div className="xl:col-span-2 space-y-8">
              
              <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
                <h2 className="text-[14px] font-bold text-white uppercase tracking-wide mb-4">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.skillsCovered.map((skill) => (
                    <div key={skill} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-[12px] text-gray-300 font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <CourseCurriculum course={course} />
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-6">
              
              <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
                <h3 className="text-[14px] font-bold text-white uppercase tracking-wide mb-4">Course Info</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Trainer</span>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0D0D0F] border border-[#292B30] flex items-center justify-center text-[10px] font-bold text-yellow-400">
                        {course.trainer.charAt(0)}
                      </div>
                      <span className="text-[12px] font-bold text-white">{course.trainer}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Enrolled Employees</span>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span className="text-[12px] font-bold text-white">24</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-[12px] font-bold text-white">4.8 / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {course.dueDate && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-6">
                  <h3 className="text-[12px] font-bold text-amber-400 uppercase tracking-wide mb-2">Deadline</h3>
                  <p className="text-[13px] font-medium text-gray-300 mb-1">This course is mandatory and must be completed by:</p>
                  <span className="text-[16px] font-black text-amber-400">
                    {new Date(course.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
