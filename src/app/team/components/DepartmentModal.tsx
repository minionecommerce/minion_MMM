'use client';

import { useState } from 'react';
import { X, Network } from 'lucide-react';
import { createDepartment } from '../actions';

interface DepartmentModalProps {
  onClose: () => void;
}

export default function DepartmentModal({ onClose }: DepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createDepartment(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to create department');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                <Network className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Create Department</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="create-dept-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-4xl mb-2">🏢</div>
                <h3 className="text-white font-bold uppercase text-[15px]">Department Created!</h3>
                <p className="text-gray-400 text-[12px]">Department added to Minion organizational structure.</p>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Department Name *</label>
                <input name="name" required className={inputCls} placeholder="e.g. Automation & Smart Home Engineering" />
              </div>
            )}

            {!submitted && (
              <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-green-400 hover:bg-green-300 text-black transition-all shadow-[0_0_15px_rgba(74,222,128,0.2)] disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Department'}
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
