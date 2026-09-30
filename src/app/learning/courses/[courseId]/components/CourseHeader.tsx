'use client';

import { Course } from '../../../data/mock';
import { ArrowLeft, Clock, FileText, User, PlayCircle, Star, Edit2, Share2, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface CourseHeaderProps {
  course: Course;
}

export default function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <div className="bg-[#111113] border-b border-[#292B30]">
      {/* Top Nav */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#292B30] bg-[#0D0D0F]">
        <Link href="/learning" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-yellow-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Learning
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-[11px] font-bold transition-colors">
            <PlayCircle className="w-4 h-4" /> Continue Course
          </button>
          <div className="w-px h-4 bg-[#292B30] mx-1" />
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1b1f] transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1b1f] transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Content */}
      <div className="px-6 py-10 max-w-5xl">
        <div className="flex flex-col gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#151619] border border-[#292B30] px-3 py-1.5 rounded-lg">
              {course.category}
            </span>
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border ${
              course.difficulty === 'Expert' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
              course.difficulty === 'Advanced' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
              course.difficulty === 'Intermediate' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
              'bg-blue-400/10 text-blue-400 border-blue-400/20'
            }`}>
              {course.difficulty}
            </span>
            <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase px-3 py-1.5">{course.id}</span>
          </div>

          <h1 className="text-[36px] font-black text-white tracking-tight leading-tight">{course.name}</h1>
          
          <p className="text-[14px] text-gray-400 max-w-3xl leading-relaxed">
            {course.description}
          </p>

          {/* Progress Bar (Overall) */}
          <div className="flex flex-col gap-2 max-w-xl mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Course Progress</span>
              <span className="text-[14px] font-black text-yellow-400">{course.progress}%</span>
            </div>
            <div className="w-full h-2 bg-[#151619] border border-[#292B30] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${course.progress}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Duration</span>
                <span className="text-[12px] font-bold text-white">{course.durationHours} Hours</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Content</span>
                <span className="text-[12px] font-bold text-white">{course.totalLessons} Lessons</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Trainer</span>
                <span className="text-[12px] font-bold text-white">{course.trainer}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
