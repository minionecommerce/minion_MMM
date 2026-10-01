'use client';

import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { scheduleMaintenance } from '../actions';

interface ScheduleMaintenanceModalProps {
  landscapes: any[];
  onClose: () => void;
}

const maintenanceTypes = [
  'Watering', 'Pruning', 'Fertilizing', 'Grass Cutting',
  'Pest Control', 'Plant Replacement', 'Cleaning',
  'Irrigation Service', 'Lighting Service', 'Pergola Maintenance', 'General Maintenance'
];

export default function ScheduleMaintenanceModal({ landscapes, onClose }: ScheduleMaintenanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await scheduleMaintenance(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to schedule maintenance');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[550px] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Schedule Maintenance Task</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="schedule-maintenance-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitted ? (
              <div className="py-12 text-center space-y-2">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-white font-bold uppercase text-[16px]">Maintenance Scheduled!</h3>
                <p className="text-gray-400 text-[12px]">Task created & next maintenance date updated.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Select Landscape *</label>
                  <select name="landscapeId" required className={inputCls}>
                    <option value="">Choose landscape...</option>
                    {landscapes.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.landscapeNumber || l.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Maintenance Type *</label>
                    <select name="type" required className={inputCls}>
                      {maintenanceTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Due Date *</label>
                    <input name="dueDate" type="date" required className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Frequency</label>
                    <select name="frequency" className={inputCls} defaultValue="Weekly">
                      <option value="One-time">One-time</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly (Every 7 days)</option>
                      <option value="Bi-weekly">Bi-weekly (Every 14 days)</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Priority</label>
                    <select name="priority" className={inputCls} defaultValue="Medium">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Assigned Employee</label>
                  <select name="assignedToId" className={inputCls}>
                    <option value="">Unassigned</option>
                    <option value="emp-mukesh">Mukesh V (Gardener Lead)</option>
                    <option value="emp-rahul">Rahul S A (Supervisor)</option>
                    <option value="emp-vignesh">Vignesh (Irrigation Tech)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Notes / Instructions</label>
                  <textarea name="notes" rows={2} className={inputCls} placeholder="Specific areas to check, fertilizers needed..." />
                </div>
              </>
            )}
          </form>

          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] bg-[#111113] flex items-center justify-between">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="schedule-maintenance-form" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-green-400 hover:bg-green-300 text-black transition-all shadow-[0_0_15px_rgba(74,222,128,0.2)] disabled:opacity-50">
                {loading ? 'Scheduling...' : 'Schedule Task'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';
