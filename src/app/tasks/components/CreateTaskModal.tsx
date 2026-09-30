'use client';

import { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { createTask } from '../actions';

interface CreateTaskModalProps {
  employees?: any[];
  projects?: any[];
  landscapes?: any[];
  onClose: () => void;
}

export default function CreateTaskModal({
  employees = [],
  projects = [],
  landscapes = [],
  onClose
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTask(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to create task');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[650px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-yellow-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Create New Task</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="create-task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {submitted ? (
              <div className="py-16 text-center space-y-2">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="text-white font-bold uppercase text-[16px]">Task Created!</h3>
                <p className="text-gray-400 text-[12px]">Task assigned & synced to database and My Work.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Task Title *</label>
                  <input name="title" required className={inputCls} placeholder="e.g. Finalize Site Wiring & Automation Setup" />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Description</label>
                  <textarea name="description" rows={3} className={inputCls} placeholder="Detailed instructions, site location, required equipment..." />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Priority *</label>
                  <select name="priority" className={inputCls} defaultValue="Medium">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Assignee</label>
                  <select name="assigneeId" className={inputCls}>
                    <option value="">Default Assignee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name || emp.designation || emp.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Secondary Assignee (Optional)</label>
                  <select name="secondaryAssigneeId" className={inputCls}>
                    <option value="">None</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name || emp.designation || emp.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Start Date</label>
                  <input name="startDate" type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Due Date</label>
                  <input name="dueDate" type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Project (Optional)</label>
                  <select name="projectId" className={inputCls}>
                    <option value="">No Project / Internal</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {landscapes.length > 0 && (
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Park / Landscape (Optional)</label>
                    <select name="landscapeId" className={inputCls}>
                      <option value="">None</option>
                      {landscapes.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.location || 'Site'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2 border-t border-[#292B30] pt-4 mt-2">
                  <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">Requirements & Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" name="requiresCompletionProof" value="true" className="w-4 h-4 rounded border-[#292B30] bg-[#0D0D0F] text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0" />
                      Requires Photo/File Proof to Complete
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" name="requiresVerification" value="true" className="w-4 h-4 rounded border-[#292B30] bg-[#0D0D0F] text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0" />
                      Requires Manager Verification
                    </label>
                  </div>
                </div>

                <div className="col-span-2 border-t border-[#292B30] pt-4 mt-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-yellow-400 cursor-pointer mb-4">
                    <input type="checkbox" name="isRecurring" value="true" className="w-4 h-4 rounded border-[#292B30] bg-[#0D0D0F] text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0" 
                      onChange={(e) => {
                        const panel = document.getElementById('recurring-panel');
                        if (panel) panel.style.display = e.target.checked ? 'grid' : 'none';
                      }}
                    />
                    MAKE THIS A RECURRING TASK SERIES
                  </label>
                  
                  <div id="recurring-panel" className="grid-cols-3 gap-4" style={{ display: 'none' }}>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Repeat Every</label>
                      <input name="repeatInterval" type="number" min="1" defaultValue="1" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Unit</label>
                      <select name="repeatUnit" className={inputCls} defaultValue="Day">
                        <option value="Day">Days</option>
                        <option value="Week">Weeks</option>
                        <option value="Month">Months</option>
                        <option value="Year">Years</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Repeat Until (Optional)</label>
                      <input name="repeatUntil" type="date" className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] bg-[#111113] flex items-center justify-between">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="create-task-form" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)] disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';

