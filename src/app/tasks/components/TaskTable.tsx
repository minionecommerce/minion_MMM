'use client';

import { MoreVertical, User, Calendar, FolderKanban } from 'lucide-react';
import { Task } from '../data/mock';

interface TaskTableProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  'LOW': 'text-gray-400',
  'MEDIUM': 'text-yellow-400',
  'HIGH': 'text-orange-400',
  'CRITICAL': 'text-red-400',
};

const statusColors: Record<string, string> = {
  'Not Started': 'bg-gray-400/10 text-gray-400',
  'Assigned': 'bg-blue-400/10 text-blue-400',
  'Accepted': 'bg-indigo-400/10 text-indigo-400',
  'In Progress': 'bg-cyan-400/10 text-cyan-400',
  'Blocked': 'bg-red-400/10 text-red-400',
  'On Hold': 'bg-amber-400/10 text-amber-400',
  'Completed': 'bg-green-400/10 text-green-400',
  'Verified': 'bg-emerald-400/10 text-emerald-400',
  'Closed': 'bg-teal-400/10 text-teal-400',
  'Cancelled': 'bg-red-400/10 text-red-400',
};

export default function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 bg-[#151619] rounded-xl border border-[#292B30]">
        <div className="text-4xl mb-3">📋</div>
        <div className="text-[14px] font-semibold">No tasks found</div>
        <div className="text-[12px] mt-1">Adjust filters or create a new task.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="border-b border-[#292B30] bg-[#111113]">
            {['Task', 'Project / Related To', 'Priority', 'Assigned To', 'Due', 'Status', 'Progress', 'Created By', ''].map(col => (
              <th key={col} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2025]">
          {tasks.map(task => {
            const dueDate = new Date(task.dueDate);
            const isToday = new Date().toDateString() === dueDate.toDateString();
            const timeStr = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="group hover:bg-[#1a1b1f] cursor-pointer transition-colors"
              >
                {/* Task Name */}
                <td className="px-4 py-3.5 pl-5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-white leading-tight">{task.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">{task.id}</span>
                  </div>
                </td>

                {/* Project / Related To */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-300">
                    <FolderKanban className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate max-w-[150px] font-semibold">{task.projectName || task.customerName || '-'}</span>
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </td>

                {/* Assigned To */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-white font-semibold">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-[9px]">
                      {task.assignedTo.charAt(0)}
                    </div>
                    {task.assignedTo}
                  </div>
                </td>

                {/* Due Date */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className={`text-[12px] font-bold ${isToday ? 'text-amber-400' : 'text-gray-300'}`}>
                      {isToday ? 'Today' : dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-gray-500">{timeStr}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </td>

                {/* Progress */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white w-8">{task.progress}%</span>
                    <div className="w-12 h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          task.progress === 100 ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* Created By */}
                <td className="px-4 py-3.5">
                  <span className="text-[11px] font-semibold text-gray-400">{task.assignedBy}</span>
                </td>

                {/* Action */}
                <td className="px-4 py-3.5 pr-5 text-right">
                  <button className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); }}>
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
