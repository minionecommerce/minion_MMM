'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateTaskModalProps {
  onClose: () => void;
}

import { useMyWork } from '../MyWorkContext';
import { createTask } from '../actions';

const taskTypes = ['Project Task', 'Follow-up', 'Site Visit', 'Admin', 'Approval'];
const employees = ['Dinesh Subramanian', 'Rahul Sharma', 'Priya Nair', 'Suresh Kumar', 'Anita Raj'];

export default function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const { projects } = useMyWork();
  const projectList = projects.map(p => ({ id: p.id, name: p.name }));
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState(taskTypes[0]);
  const [relatedProject, setRelatedProject] = useState('');
  const [assignedTo, setAssignedTo] = useState(employees[0]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [description, setDescription] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const priorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical'];
  const priorityColors = {
    Low: 'bg-gray-100 text-gray-600 border-gray-200',
    Medium: 'bg-blue-50 text-blue-600 border-blue-200',
    High: 'bg-orange-50 text-orange-600 border-orange-200',
    Critical: 'bg-red-50 text-red-600 border-red-200',
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklistItems(prev => [...prev, newCheckItem.trim()]);
    setNewCheckItem('');
  };

  const removeCheckItem = (idx: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    
    const formData = new FormData();
    formData.append("title", taskName);
    formData.append("description", description);
    formData.append("dueDate", dueDate);
    formData.append("dueTime", dueTime);
    formData.append("priority", priority);
    formData.append("projectId", relatedProject);

    setSubmitted(true);
    await createTask(formData);
    setTimeout(onClose, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Create New Task</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-white">Task Created!</p>
                <p className="text-[12px] text-gray-500">Closing...</p>
              </div>
            ) : (
              <>
                {/* Task Name */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Task Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={taskName}
                    onChange={e => setTaskName(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Task Type + Project */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Task Type
                    </label>
                    <select
                      value={taskType}
                      onChange={e => setTaskType(e.target.value)}
                      className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors appearance-none"
                    >
                      {taskTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Related Project
                    </label>
                    <select
                      value={relatedProject}
                      onChange={e => setRelatedProject(e.target.value)}
                      className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors appearance-none"
                    >
                      <option value="">Select Project</option>
                      {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Assigned To
                  </label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors appearance-none"
                  >
                    {employees.map((emp: string) => <option key={emp} value={emp}>{emp}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Priority
                  </label>
                  <div className="flex items-center gap-2">
                    {priorities.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          priority === p
                            ? priorityColors[p]
                            : 'bg-[#0D0D0F] text-gray-600 border-[#292B30] hover:border-gray-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the task..."
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors resize-none"
                  />
                </div>

                {/* Checklist */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Checklist
                  </label>
                  <div className="space-y-2 mb-2">
                    {checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2">
                        <div className="w-3.5 h-3.5 rounded border border-gray-600 shrink-0" />
                        <span className="flex-1 text-[12px] text-gray-300">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeCheckItem(idx)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                      placeholder="Add checklist item..."
                      className="flex-1 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2 text-[12px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addCheckItem}
                      className="w-8 h-8 bg-yellow-400/10 border border-yellow-400/30 rounded-lg flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>

          {/* Modal Footer */}
          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] flex items-center gap-3 bg-[#111113]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white hover:border-gray-500 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!taskName.trim()}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
