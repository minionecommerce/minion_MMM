'use client';

import { Map, Layers, Clock, ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';

const mockPaths = [
  {
    id: 'path-1',
    name: 'Smart Home Installation Pro',
    description: 'A complete end-to-end journey to master smart home wiring, device installation, and basic programming.',
    totalCourses: 5,
    completedCourses: 2,
    durationHours: 45,
    level: 'Intermediate',
    category: 'Installation',
    courses: [
      { name: 'Basics of Low Voltage Wiring', status: 'Completed' },
      { name: 'Rack Building Essentials', status: 'Completed' },
      { name: 'Control4 Hardware Setup', status: 'In Progress' },
      { name: 'Audio Matrix Configurations', status: 'Pending' },
      { name: 'Final Testing & Handoff', status: 'Pending' }
    ]
  },
  {
    id: 'path-2',
    name: 'Project Management Mastery',
    description: 'Learn how to manage enterprise smart home projects from initial BOQ to final customer handover.',
    totalCourses: 4,
    completedCourses: 0,
    durationHours: 30,
    level: 'Advanced',
    category: 'Management',
    courses: [
      { name: 'Agile for AV Projects', status: 'Pending' },
      { name: 'Client Communication Strategies', status: 'Pending' },
      { name: 'Budgeting & Change Orders', status: 'Pending' },
      { name: 'Quality Assurance Processes', status: 'Pending' }
    ]
  }
];

export default function LearningPathsTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-[20px] font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            Learning Paths
          </h2>
          <p className="text-[12px] text-gray-400 mt-2 max-w-lg leading-relaxed">
            Curated journeys designed to take you from beginner to expert in specific roles or domains. Follow the path to master a complete skill set.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {mockPaths.map((path, idx) => (
          <div 
            key={path.id} 
            className="group bg-[#151619] border border-[#292B30] rounded-2xl overflow-hidden hover:border-blue-400/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] p-6 md:p-8"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex flex-col xl:flex-row gap-8">
              
              {/* Path Info */}
              <div className="xl:w-1/3 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#0D0D0F] border border-[#292B30] px-2 py-1 rounded">
                    {path.category}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#0D0D0F] border border-[#292B30] px-2 py-1 rounded">
                    {path.level}
                  </span>
                </div>
                
                <h3 className="text-[22px] font-black text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">
                  {path.name}
                </h3>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
                  {path.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Duration</span>
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      <Clock className="w-4 h-4 text-blue-400" /> {path.durationHours} Hours
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Courses</span>
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      <Layers className="w-4 h-4 text-blue-400" /> {path.totalCourses} Modules
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Path Progress</span>
                    <span className="text-[11px] font-bold text-white">
                      {Math.round((path.completedCourses / path.totalCourses) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30] mb-6">
                    <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${(path.completedCourses / path.totalCourses) * 100}%` }} />
                  </div>

                  <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-[12px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    {path.completedCourses > 0 ? 'Resume Path' : 'Start Path'}
                    <PlayCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Course Journey Timeline */}
              <div className="xl:w-2/3 bg-[#0D0D0F] border border-[#292B30] rounded-xl p-6 relative">
                <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-6">Journey Curriculum</h4>
                
                <div className="space-y-6 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-[#292B30]" />

                  {path.courses.map((course, cIdx) => (
                    <div key={cIdx} className="flex gap-4 relative z-10">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-[#0D0D0F] ${
                        course.status === 'Completed' ? 'border-green-400 text-green-400' : 
                        course.status === 'In Progress' ? 'border-blue-400 text-blue-400' : 'border-[#292B30] text-gray-600'
                      }`}>
                        {course.status === 'Completed' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        {course.status === 'In Progress' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                        {course.status === 'Pending' && <span className="text-[10px] font-bold">{cIdx + 1}</span>}
                      </div>
                      
                      <div className={`flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg border transition-colors ${
                        course.status === 'Completed' ? 'bg-green-400/5 border-green-400/10 hover:border-green-400/30' :
                        course.status === 'In Progress' ? 'bg-blue-400/5 border-blue-400/20 hover:border-blue-400/40' : 'bg-[#151619] border-[#292B30] hover:border-gray-500'
                      }`}>
                        <span className={`text-[13px] font-bold ${course.status === 'Pending' ? 'text-gray-400' : 'text-white'}`}>
                          {course.name}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          {course.status === 'Completed' && <span className="text-[10px] font-bold text-green-400 uppercase">Completed</span>}
                          {course.status === 'In Progress' && <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-400/10 px-2 py-0.5 rounded">In Progress</span>}
                          {course.status === 'Pending' && <span className="text-[10px] font-bold text-gray-500 uppercase">Pending</span>}
                          
                          <button className="text-gray-500 hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
