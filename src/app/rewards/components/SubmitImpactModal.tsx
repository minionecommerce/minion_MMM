'use client';

import { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { submitImpactActivity } from '../actions';

interface SubmitImpactModalProps {
  employees?: any[];
  onClose: () => void;
}

export default function SubmitImpactModal({ employees = [], onClose }: SubmitImpactModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await submitImpactActivity(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to submit impact activity');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Submit Community Impact</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-4xl mb-2">🌱</div>
                <h3 className="text-white font-bold uppercase text-[15px]">Impact Recorded!</h3>
                <p className="text-emerald-400 text-[12px]">Impact points logged to ledger.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Participant Employee *</label>
                  <select name="employeeId" required className={inputCls}>
                    <option value="">Choose Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name || emp.designation || emp.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Activity Title *</label>
                  <input name="title" required className={inputCls} placeholder="e.g. Tree Plantation Drive / Community Tech Mentorship" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Impact Category</label>
                    <select name="category" className={inputCls} defaultValue="Tree Plantation">
                      <option value="Tree Plantation">Tree Plantation</option>
                      <option value="Community Service">Community Service</option>
                      <option value="Education Support">Education Support</option>
                      <option value="Environmental">Environmental Activities</option>
                      <option value="Blood Donation">Blood Donation</option>
                      <option value="Helping People">Helping People / Volunteering</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Impact Points</label>
                    <input name="points" type="number" defaultValue="50" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {!submitted && (
              <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-emerald-400 hover:bg-emerald-300 text-black transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Log Impact Activity'}
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
