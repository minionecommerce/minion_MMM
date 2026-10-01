'use client';

import { MaintenanceTask } from '../../data/mock';
import { Calendar, Clock, CheckCircle2, AlertTriangle, Plus, ChevronDown } from 'lucide-react';

interface MaintenanceScheduleProps {
  tasks: MaintenanceTask[];
}

const priorityColors: Record<string, string> = {
  'Low': 'text-gray-400',
  'Medium': 'text-blue-400',
  'High': 'text-amber-400',
  'Critical': 'text-red-400',
};

const statusColors: Record<string, string> = {
  'Pending': 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  'Scheduled': 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  'Completed': 'bg-green-400/10 text-green-400 border border-green-400/20',
  'Overdue': 'bg-red-400/10 text-red-400 border border-red-400/20',
};

export default function MaintenanceSchedule({ tasks }: MaintenanceScheduleProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">MAINTENANCE</h2>
            <div className="text-[12px] font-semibold text-gray-400 mt-1">Manage recurring work and schedules</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[12px] font-bold text-gray-300 hover:text-white rounded-lg transition-colors">
            Filters <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-black text-[12px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Plus className="w-4 h-4" /> Schedule Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#151619] border border-[#292B30] p-1 rounded-xl w-fit">
        {['Today', 'This Week', 'Upcoming', 'Overdue', 'Completed'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors ${
              tab === 'Today' 
                ? 'bg-orange-400 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                : tab === 'Overdue' ? 'text-red-400 hover:bg-[#1a1b1f]' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#111113]">
                {['Task', 'Type', 'Assigned To', 'Due Date', 'Priority', 'Status', ''].map(col => (
                  <th key={col} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2025]">
              {tasks.map(task => (
                <tr key={task.id} className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white mb-0.5">{task.task}</span>
                      <span className="text-[10px] font-mono text-gray-600">{task.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-400">{task.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{task.assignedTo}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className={`text-[12px] font-bold ${task.dueDate === 'Today' ? 'text-orange-400' : task.dueDate === 'Overdue' ? 'text-red-400' : 'text-gray-300'}`}>
                        {task.dueDate}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[12px] font-bold ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="px-3 py-1.5 bg-orange-400 hover:bg-orange-300 text-black text-[10px] font-bold uppercase tracking-wider rounded transition-all opacity-0 group-hover:opacity-100">
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No maintenance tasks scheduled</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
