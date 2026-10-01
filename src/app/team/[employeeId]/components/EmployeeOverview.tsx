'use client';

import { Employee } from '../../data/mock';
import { Activity, BookOpen, CheckSquare, FolderKanban, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeOverview({ employee }: { employee: Employee }) {
  return (
    <div className="px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Left Column */}
      <div className="xl:col-span-2 space-y-8">
        
        {/* Performance & Productivity */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-pink-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">My Performance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Overall Rating</span>
                <span className="text-[24px] font-black text-green-400">{employee.performance.overall}%</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Task Completion', val: employee.performance.taskCompletion },
                  { label: 'On-Time', val: employee.performance.onTime },
                  { label: 'Project Delivery', val: employee.performance.projectDelivery },
                  { label: 'Customer Follow-up', val: employee.performance.customerFollowUp }
                ].map(metric => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-gray-300">{metric.label}</span>
                      <span className="text-[11px] font-bold text-gray-400">{metric.val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0D0D0F] border border-[#292B30] rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${metric.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tasks Completed</span>
                  <span className="text-[20px] font-black text-white">{employee.workload.completed}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Projects Supported</span>
                  <span className="text-[20px] font-black text-white">{employee.projects.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Learning Sessions</span>
                  <span className="text-[20px] font-black text-white">{employee.learning.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Achievements</span>
                  <span className="text-[20px] font-black text-white">04</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Growth Indicator</span>
                </div>
                <p className="text-[12px] text-gray-300 font-medium">Consistently exceeding targets in task completion. Ready for next project leadership module.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Assignments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Current Assignments</h2>
            </div>
          </div>

          <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#111113] border-b border-[#292B30]">
                <tr>
                  {['Project', 'Role', 'Progress', 'Tasks', 'Priority'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider first:pl-6">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]">
                {employee.projects.map(prj => (
                  <tr key={prj.id} className="hover:bg-[#1a1b1f] transition-colors">
                    <td className="px-4 py-3 pl-6">
                      <Link href={`/projects/${prj.id}`} className="text-[12px] font-bold text-white hover:text-blue-400 transition-colors">
                        {prj.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 font-medium">{prj.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-white w-6">{prj.progress}%</span>
                        <div className="w-16 h-1 bg-[#0D0D0F] rounded-full border border-[#292B30]">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${prj.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-gray-400">{prj.taskCount} tasks</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${prj.priority === 'High' || prj.priority === 'Critical' ? 'bg-orange-400/10 text-orange-400' : 'bg-gray-400/10 text-gray-400'}`}>
                        {prj.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                {employee.projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-[12px] text-gray-500">No active projects assigned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        
        {/* Workload */}
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckSquare className="w-4 h-4 text-yellow-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Workload</h2>
          </div>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#292B30]">
            <span className="text-[12px] font-bold text-gray-400">Current Capacity</span>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded uppercase ${
              employee.workload.status === 'HIGH' ? 'bg-orange-400/10 text-orange-400' :
              employee.workload.status === 'OVERLOADED' ? 'bg-red-400/10 text-red-400' :
              'bg-green-400/10 text-green-400'
            }`}>
              {employee.workload.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Open Tasks</span>
              <span className="text-[18px] font-black text-white">{employee.workload.openTasks}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Due Today</span>
              <span className="text-[18px] font-black text-yellow-400">{employee.workload.dueToday}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Overdue</span>
              <span className="text-[18px] font-black text-red-400">{employee.workload.overdue}</span>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">In Progress</span>
              <span className="text-[18px] font-black text-cyan-400">{employee.workload.inProgress}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Skills Directory</h2>
          </div>
          
          <div className="space-y-4">
            {employee.skills.map(skill => (
              <div key={skill.name} className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-bold text-white">{skill.name}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{skill.experienceYears} Yrs</span>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4].map(dot => (
                    <div 
                      key={dot}
                      className={`h-1.5 flex-1 rounded-full ${
                        (skill.level === 'Expert' && dot <= 4) ||
                        (skill.level === 'Advanced' && dot <= 3) ||
                        (skill.level === 'Intermediate' && dot <= 2) ||
                        (skill.level === 'Beginner' && dot <= 1)
                          ? 'bg-purple-400' : 'bg-[#292B30]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mt-1.5">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning */}
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Learning</h2>
            </div>
          </div>

          <div className="space-y-4">
            {employee.learning.map(course => (
              <div key={course.courseName}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[12px] font-bold text-gray-300 pr-4">{course.courseName}</span>
                  <span className="text-[11px] font-bold text-cyan-400">{course.progress}%</span>
                </div>
                <div className="w-full h-1 bg-[#0D0D0F] border border-[#292B30] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
            {employee.learning.length === 0 && (
              <div className="text-[12px] text-gray-500 text-center py-4">No active learning programs.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
