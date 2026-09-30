'use client';

import { Task } from '../../data/mock';
import { CheckSquare, Clock, AlertTriangle, Plus, ChevronRight } from 'lucide-react';

interface ProjectTasksProps {
  tasks: Task[];
}

const priorityColors: Record<string, string> = {
  'Low': 'bg-blue-400/10 text-blue-400',
  'Medium': 'bg-green-400/10 text-green-400',
  'High': 'bg-amber-400/10 text-amber-400',
  'Critical': 'bg-red-400/10 text-red-400',
};

const statusColors: Record<string, string> = {
  'Not Started': 'bg-gray-400/10 text-gray-400',
  'In Progress': 'bg-yellow-400/10 text-yellow-400',
  'Completed': 'bg-green-400/10 text-green-400',
  'Delayed': 'bg-red-400/10 text-red-400',
};

const getStatusStyle = (status?: string) => {
  const cls = (status && statusColors[status]) || 'bg-gray-400/10 text-gray-400';
  const border = cls.replace('bg-', 'border-').replace('/10', '/20');
  return `${border} ${cls}`;
};

const getPriorityCls = (priority?: string) => {
  return (priority && priorityColors[priority]) || 'bg-blue-400/10 text-blue-400';
};

export default function ProjectTasks({ tasks }: ProjectTasksProps) {
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Not Started').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">TASKS</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[12px] font-bold text-gray-400">Total: <span className="text-white">{tasks.length}</span></span>
              <span className="text-[12px] font-bold text-green-400">Completed: {completed}</span>
              <span className="text-[12px] font-bold text-yellow-400">In Progress: {inProgress}</span>
              <span className="text-[12px] font-bold text-gray-500">Pending: {pending}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[12px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors">
            View All Tasks
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#292B30] bg-[#111113]">
                {['Task', 'Assigned To', 'Priority', 'Start Date', 'Due Date', 'Progress', 'Status', ''].map(col => (
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
                      <span className="text-[13px] font-bold text-white mb-0.5">{task.title}</span>
                      <span className="text-[10px] font-mono text-gray-600">{task.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-semibold text-gray-300">{task.assignedTo}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getPriorityCls(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-gray-400">{task.startDate}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[12px] font-semibold text-gray-300">{task.dueDate}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-white w-8">{task.progress}%</span>
                      <div className="w-16 h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                        <div 
                          className={`h-full rounded-full transition-all ${task.progress === 100 ? 'bg-green-400' : 'bg-yellow-400'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusStyle(task.status)}`}>
                      {task.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                      Open <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-[14px] font-semibold">No tasks found</div>
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
