'use client';

import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { bulkAssignTasks } from '../actions';

interface BulkAssignModalProps {
  tasks: any[];
  employees?: any[];
  onClose: () => void;
}

export default function BulkAssignModal({ tasks, employees = [], onClose }: BulkAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');

  const toggleTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskIds.length === 0) {
      alert('Please select at least one task to reassign.');
      return;
    }
    setLoading(true);
    const res = await bulkAssignTasks(selectedTaskIds, assigneeId);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to bulk assign tasks');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[550px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Bulk Assign Tasks</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {submitted ? (
              <div className="py-12 text-center space-y-2">
                <div className="text-4xl mb-2">👥</div>
                <h3 className="text-white font-bold uppercase text-[16px]">Tasks Reassigned!</h3>
                <p className="text-blue-400 text-[12px]">{selectedTaskIds.length} tasks assigned successfully.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Target Employee *</label>
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)} 
                    required 
                    className={inputCls}
                  >
                    <option value="">Choose Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name || emp.designation || emp.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-[#292B30] rounded-xl p-4 bg-[#0D0D0F]">
                  <div className="flex items-center justify-between mb-3 border-b border-[#292B30] pb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Select Tasks ({selectedTaskIds.length} selected)</span>
                    <button type="button" onClick={selectAll} className="text-[11px] font-semibold text-yellow-400 hover:underline">
                      {selectedTaskIds.length === tasks.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                    {tasks.map(t => (
                      <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#151619] cursor-pointer transition-colors border border-[#1e2025]">
                        <input 
                          type="checkbox" 
                          checked={selectedTaskIds.includes(t.id)} 
                          onChange={() => toggleTask(t.id)}
                          className="w-4 h-4 accent-yellow-400 rounded"
                        />
                        <div className="flex-1 truncate">
                          <div className="text-[12px] font-bold text-white truncate">{t.name || t.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{t.id}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!submitted && (
              <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading || selectedTaskIds.length === 0} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-blue-400 hover:bg-blue-300 text-black transition-all shadow-[0_0_15px_rgba(96,165,250,0.2)] disabled:opacity-50">
                  {loading ? 'Assigning...' : `Assign ${selectedTaskIds.length} Tasks`}
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';

