'use client';

import { useState } from 'react';
import { Course } from '../data/mock';
import { Search, Filter, PlayCircle, Star, Clock, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CoursesTabProps {
  courses: Course[];
}

export default function CoursesTab({ courses }: CoursesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'All' || course.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-[18px] font-black text-white uppercase tracking-wide">Course Catalog</h2>
          <p className="text-[12px] text-gray-400 mt-1">Explore and enroll in skill development programs.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg pl-9 pr-4 py-2 text-[12px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0D0D0F] border border-[#292B30] rounded-lg text-[12px] font-bold text-gray-300 hover:text-white hover:border-gray-500 transition-colors shrink-0">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap transition-all ${
              activeFilter === cat 
                ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.3)]' 
                : 'bg-[#151619] border border-[#292B30] text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course, idx) => (
          <div 
            key={course.id} 
            className="group relative bg-[#151619] border border-[#292B30] rounded-2xl overflow-hidden hover:border-yellow-400/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,196,0,0.1)] hover:-translate-y-1"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Thumbnail / Header Area */}
            <div className="h-32 bg-gradient-to-br from-[#1a1b1f] to-[#0D0D0F] relative p-5 flex flex-col justify-between border-b border-[#292B30]">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                <PlayCircle className="w-24 h-24 text-yellow-400 transform translate-x-4 -translate-y-4" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-black text-white uppercase tracking-wider bg-white/10 backdrop-blur-md px-2.5 py-1 rounded">
                  {course.category}
                </span>
                {course.status === 'Completed' && (
                  <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded border border-green-400/20">
                    Completed
                  </span>
                )}
                {course.status === 'In Progress' && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded border border-blue-400/20">
                    In Progress
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col h-[200px]">
              <h3 className="text-[16px] font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">{course.name}</h3>
              <p className="text-[12px] text-gray-400 line-clamp-2 mb-4 flex-1">
                {course.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-semibold bg-[#0D0D0F] rounded-lg px-2 py-1.5 border border-[#292B30]">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> {course.durationHours} Hours
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-semibold bg-[#0D0D0F] rounded-lg px-2 py-1.5 border border-[#292B30]">
                  <FileText className="w-3.5 h-3.5 text-gray-500" /> {course.totalLessons} Lessons
                </div>
              </div>

              {course.status === 'Not Started' ? (
                <button className="w-full py-2.5 bg-[#0D0D0F] border border-[#292B30] group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400 rounded-lg text-[12px] font-bold text-gray-300 transition-all">
                  Enroll Now
                </button>
              ) : (
                <Link href={`/learning/courses/${course.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-black rounded-lg text-[12px] font-bold transition-all">
                  {course.status === 'In Progress' ? (
                    <><PlayCircle className="w-3.5 h-3.5" /> Continue Learning</>
                  ) : (
                    <><Star className="w-3.5 h-3.5" /> Review Course</>
                  )}
                </Link>
              )}
            </div>
          </div>
        ))}

        {filteredCourses.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="text-gray-500 mb-2">No courses found matching your criteria.</div>
            <button 
              onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
              className="text-[12px] text-yellow-400 hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
