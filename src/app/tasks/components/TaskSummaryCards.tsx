'use client';

import { CheckSquare, ListTodo, PlayCircle, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

interface TaskSummaryCardsProps {
  tasks?: any[];
  onCardClick?: (title: string) => void;
}

export default function TaskSummaryCards({ tasks = [], onCardClick }: TaskSummaryCardsProps) {
  const totalTasks = tasks.length;
  const myTasksCount = tasks.filter(t => t.assignedTo !== 'Unassigned').length || totalTasks;
  
  const todayStr = new Date().toDateString();
  const dueTodayCount = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr && t.status !== 'Completed' && t.status !== 'Closed').length;
  
  const inProgressCount = tasks.filter(t => t.status === 'In Progress' || t.status === 'IN_PROGRESS').length;
  
  const now = new Date();
  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed' && t.status !== 'Verified' && t.status !== 'Closed').length;
  
  const completedCount = tasks.filter(t => t.status === 'Completed' || t.status === 'Verified' || t.status === 'Closed').length;

  const productivityPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const cards = [
    {
      title: 'MY TASKS',
      value: String(myTasksCount).padStart(2, '0'),
      sub1: `${String(dueTodayCount).padStart(2, '0')} Due Today`,
      sub2: `${String(overdueCount).padStart(2, '0')} Overdue`,
      icon: CheckSquare,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20'
    },
    {
      title: 'ALL TASKS',
      value: String(totalTasks),
      sub1: 'Total Active Tasks',
      sub2: '',
      icon: ListTodo,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20'
    },
    {
      title: 'IN PROGRESS',
      value: String(inProgressCount),
      sub1: 'Currently Active',
      sub2: '',
      icon: PlayCircle,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10 border-cyan-400/20'
    },
    {
      title: 'OVERDUE',
      value: String(overdueCount),
      sub1: 'Needs Attention',
      sub2: '',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20'
    },
    {
      title: 'COMPLETED',
      value: String(completedCount),
      sub1: 'Completed Tasks',
      sub2: '',
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/20'
    },
    {
      title: 'TEAM PRODUCTIVITY',
      value: `${productivityPercent}%`,
      sub1: 'Completion Rate',
      sub2: '',
      icon: Activity,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10 border-pink-400/20'
    }
  ];

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              onClick={() => onCardClick?.(card.title)}
              className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight w-2/3">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div>
                <div className="text-[22px] font-black text-white leading-none mb-2">{card.value}</div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[10px] font-semibold ${card.sub1.includes('Due Today') ? 'text-amber-400' : 'text-gray-400'}`}>{card.sub1}</span>
                  {card.sub2 && (
                    <span className={`text-[10px] font-semibold ${card.sub2.includes('Overdue') ? 'text-red-400' : 'text-gray-400'}`}>
                      {card.sub2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

