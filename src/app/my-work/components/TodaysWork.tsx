'use client';

import { useState } from 'react';
import { Search, Filter, MoreHorizontal, Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { WorkTask, Priority, TaskStatus } from '../data/mock';
import { useMyWork } from "../MyWorkContext";
import { completeTask } from '../actions';

type TabFilter = 'All' | 'Pending' | 'In Progress' | 'Completed';

interface TodaysWorkProps {
  onTaskClick: (task: WorkTask) => void;
}

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  LOW: { label: 'LOW', class: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'MED', class: 'bg-blue-50 text-blue-600' },
  HIGH: { label: 'HIGH', class: 'bg-orange-50 text-orange-600' },
  CRITICAL: { label: 'CRIT', class: 'bg-red-50 text-red-600' },
};

const statusConfig: Record<TaskStatus, { label: string; class: string; icon: React.ReactNode }> = {
  PENDING: { label: 'PENDING', class: 'bg-gray-100 text-gray-500', icon: <Circle className="w-3 h-3" /> },
  IN_PROGRESS: { label: 'IN PROGRESS', class: 'bg-blue-50 text-blue-600', icon: <Clock className="w-3 h-3" /> },
  COMPLETED: { label: 'DONE', class: 'bg-green-50 text-green-600', icon: <CheckCircle2 className="w-3 h-3" /> },
  OVERDUE: { label: 'OVERDUE', class: 'bg-red-50 text-red-600', icon: <AlertCircle className="w-3 h-3" /> },
};

const typeLabels: Record<string, string> = {
  project: 'Project',
  followup: 'Follow-up',
  site: 'Site Visit',
  admin: 'Admin',
  approval: 'Approval',
};

export default function TodaysWork({ onTaskClick }: TodaysWorkProps) {
  const { tasks } = useMyWork();

  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [search, setSearch] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(tasks.filter(t => t.status === 'COMPLETED').map(t => t.id))
  );

  const tabs: TabFilter[] = ['All', 'Pending', 'In Progress', 'Completed'];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.project?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (task.customer?.toLowerCase().includes(search.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    const isCompleted = completedIds.has(task.id);
    if (activeTab === 'Completed') return isCompleted;
    if (activeTab === 'In Progress') return task.status === 'IN_PROGRESS' && !isCompleted;
    if (activeTab === 'Pending') return (task.status === 'PENDING' || task.status === 'OVERDUE') && !isCompleted;
    return true;
  });

  const toggleComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // optimistic update
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (!next.has(id)) next.add(id); // only allow completing for now
      return next;
    });

    try {
      await completeTask(id);
    } catch (err) {
      console.error(err);
      // revert on fail (simplified)
    }
  };

  return (
    <div className="bg-[#151619] rounded-xl border border-[#292B30] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-white">Today&apos;s Work</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Your priority tasks and activities for today.</p>
          </div>
          <button className="text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
            View All →
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg pl-8 pr-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[12px] text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[#292B30]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[11px] font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'All' && <span className="ml-1 text-[10px] text-gray-600">({tasks.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-[#1e2025]">
        {filteredTasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-[13px]">
            No tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = completedIds.has(task.id);
            const priority = priorityConfig[task.priority];
            const status = isCompleted
              ? statusConfig.COMPLETED
              : statusConfig[task.status];

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[#1a1b1f] cursor-pointer transition-colors group"
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => toggleComplete(task.id, e)}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-yellow-400 border-yellow-400'
                      : 'border-gray-600 hover:border-yellow-400/60'
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[13px] font-semibold leading-snug ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </span>
                    {task.status === 'OVERDUE' && !isCompleted && (
                      <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wide">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.project && (
                      <span className="text-[11px] text-gray-500">{task.project}</span>
                    )}
                    {task.customer && !task.project && (
                      <span className="text-[11px] text-gray-500">{task.customer}</span>
                    )}
                    <span className="text-[11px] text-gray-600">•</span>
                    <span className="text-[11px] text-gray-600 uppercase tracking-wide">{typeLabels[task.type]}</span>
                  </div>
                </div>

                {/* Due time - hidden on small screens */}
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500 shrink-0">
                  <Clock className="w-3 h-3" />
                  {task.dueTime}
                </div>

                {/* Priority Badge */}
                <span className={`hidden md:inline text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${priority.class}`}>
                  {priority.label}
                </span>

                {/* Status Badge */}
                <span className={`hidden lg:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${status.class}`}>
                  {status.icon}
                  {status.label}
                </span>

                {/* More menu */}
                <button
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
