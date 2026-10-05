import { TASK_TYPES, type TaskTypeId } from '@/lib/tasks/rules';

const TYPE_COLOR: Record<TaskTypeId, string> = { task: '#6b7280', lead: '#f59e0b', project: '#2563eb', deal: '#16a34a', office: '#7c3aed' };

export const typeLabel = (type: TaskTypeId) => TASK_TYPES.find(t => t.id === type)?.label ?? 'Task';

// Small coloured tag showing the task's type; it sits beside the Task Name and never changes it
export function TypeTag({ type }: { type: TaskTypeId }) {
  return <span style={{ background: TYPE_COLOR[type] }} className="inline-block text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">{typeLabel(type)}</span>;
}

const STATUS_STYLE: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-700 border-gray-300',
  Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-800 border-amber-300',
  Blocked: 'bg-red-50 text-red-700 border-red-200',
  Waiting: 'bg-purple-50 text-purple-700 border-purple-200',
  Completed: 'bg-green-50 text-green-700 border-green-300',
  Verified: 'bg-green-50 text-green-700 border-green-300',
  Closed: 'bg-green-50 text-green-700 border-green-300',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${STATUS_STYLE[status] ?? STATUS_STYLE['Not Started']}`}>{status}</span>;
}

// "-7 months 23 days" and "Due now" are overdue/urgent (red), "2 days left.." is a warning (amber), the rest is plain
export function remainingClass(text: string) {
  if (text.startsWith('-') || text === 'Due now') return 'text-[#d9232b] font-semibold';
  if (text.includes('left')) return 'text-amber-700';
  return 'text-gray-500';
}
