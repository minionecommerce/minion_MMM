'use client';

import { useState } from 'react';
import {
  X, CheckCircle2, Circle, Clock, AlertCircle, Paperclip,
  MessageSquare, Send, ChevronRight, Tag, FolderOpen, User
} from 'lucide-react';
import { WorkTask } from '../data/mock';

interface TaskDetailDrawerProps {
  task: WorkTask | null;
  onClose: () => void;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-50 text-orange-600',
  CRITICAL: 'bg-red-50 text-red-600',
};

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-500',
  IN_PROGRESS: 'bg-blue-50 text-blue-600',
  COMPLETED: 'bg-green-50 text-green-600',
  OVERDUE: 'bg-red-50 text-red-600',
};

export default function TaskDetailDrawer({ task, onClose }: TaskDetailDrawerProps) {
  const [checklist, setChecklist] = useState(task?.checklist ?? []);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(task?.comments ?? []);
  const [isCompleted, setIsCompleted] = useState(task?.status === 'COMPLETED');

  // Update internal state when task changes
  if (!task) return null;

  const toggleCheckItem = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  const addComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [...prev, { author: 'You', avatar: 'D', text: comment, time: 'Just now' }]);
    setComment('');
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#151619] border-l border-[#292B30] z-50 flex flex-col overflow-hidden shadow-2xl">

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#292B30] bg-[#111113]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
            <span className="text-[13px] font-bold text-white uppercase tracking-wider">Task Details</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Title & Status */}
            <div>
              <h2 className="text-[17px] font-bold text-white leading-tight mb-2">{task.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusColors[isCompleted ? 'COMPLETED' : task.status]}`}>
                  {isCompleted ? 'COMPLETED' : task.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-3">
              {task.project && (
                <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FolderOpen className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Project</span>
                  </div>
                  <span className="text-[12px] font-semibold text-white">{task.project}</span>
                </div>
              )}
              {task.customer && (
                <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">Customer</span>
                  </div>
                  <span className="text-[12px] font-semibold text-white">{task.customer}</span>
                </div>
              )}
              <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Assigned To</span>
                </div>
                <span className="text-[12px] font-semibold text-white">{task.assignedTo}</span>
              </div>
              <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Due</span>
                </div>
                <span className="text-[12px] font-semibold text-white">{task.dueDate} • {task.dueTime}</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 font-semibold">Description</div>
                <p className="text-[13px] text-gray-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Checklist</div>
                  <span className="text-[11px] text-gray-500">{doneCount}/{checklist.length}</span>
                </div>
                {/* Progress */}
                <div className="w-full bg-[#1e2025] rounded-full h-1 mb-3 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {checklist.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleCheckItem(idx)}
                      className="flex items-center gap-3 w-full text-left group"
                    >
                      <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.done ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600 group-hover:border-yellow-400/60'
                      }`}>
                        {item.done && (
                          <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 10 10">
                            <path d="M1.5 5L4 7.5 8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[13px] transition-colors ${item.done ? 'line-through text-gray-600' : 'text-white group-hover:text-yellow-50'}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 font-semibold">Attachments</div>
                <div className="space-y-2">
                  {task.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 hover:border-yellow-400/30 cursor-pointer transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-[12px] text-gray-300 flex-1 truncate">{att.name}</span>
                      <span className="text-[11px] text-gray-600 shrink-0">{att.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-3 font-semibold">Comments</div>
              <div className="space-y-3 mb-3">
                {comments.length === 0 ? (
                  <p className="text-[12px] text-gray-700 italic">No comments yet.</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                        <span className="text-yellow-400 text-[10px] font-bold">{c.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-white">{c.author}</span>
                          <span className="text-[10px] text-gray-600">{c.time}</span>
                        </div>
                        <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[12px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
                <button
                  onClick={addComment}
                  className="w-9 h-9 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-4 border-t border-[#292B30] flex items-center gap-3 bg-[#111113]">
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-bold transition-all active:scale-95 ${
              isCompleted
                ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white hover:border-gray-500 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
