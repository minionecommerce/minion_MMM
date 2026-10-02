'use client';

import { useState } from 'react';
import { useDropdown } from '@/lib/dropdowns/useDropdown';
import { X, Trees } from 'lucide-react';
import { createLandscape } from '../actions';

interface CreateLandscapeModalProps {
  onClose: () => void;
}

const landscapeTypes = [
  'Residential Garden', 'Villa Landscape', 'Terrace Garden',
  'Apartment Landscape', 'Corporate Landscape', 'Commercial Landscape',
  'Public Park', 'Vertical Garden', 'Outdoor Space', 'Maintenance Contract', 'Other'
];

export default function CreateLandscapeModal({ onClose }: CreateLandscapeModalProps) {
  const [loading, setLoading] = useState(false);
  const ddLandscapeType = useDropdown('LANDSCAPE_TYPE', landscapeTypes);
  const [submitted, setSubmitted] = useState(false);
  const [assignedNumber, setAssignedNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createLandscape(formData);
    setLoading(false);

    if (res.success) {
      setAssignedNumber(res.landscapeNumber || 'LAND-2026-0001');
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      alert(res.error || 'Failed to create landscape');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <Trees className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">New Landscape Project</h2>
                <div className="text-[11px] font-mono text-yellow-400/60 mt-0.5">LAND-2026-XXXX</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="create-landscape-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-2">
                  <Trees className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-[18px] font-bold text-white uppercase tracking-wider">Landscape Created!</p>
                <p className="text-[14px] text-yellow-400 font-mono">{assignedNumber}</p>
                <p className="text-[12px] text-gray-500 mt-2">Refreshing Parks Dashboard...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                
                {/* Basic Details */}
                <div className="col-span-2 text-[12px] font-bold text-white border-b border-[#292B30] pb-2">Basic Details</div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Landscape Name *</label>
                  <input name="name" required className={inputCls} placeholder="e.g. Green Villa Garden" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Customer Name *</label>
                  <input name="customerName" required className={inputCls} placeholder="Customer / Client Name" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Landscape Type *</label>
                  <select name="type" required className={inputCls} key={ddLandscapeType.ready ? 'ready' : 'loading'} defaultValue={ddLandscapeType.defaultValue ?? ddLandscapeType.options[0]}>
                    {ddLandscapeType.options.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Site Location *</label>
                  <input name="location" required className={inputCls} placeholder="e.g. OMR, Chennai" />
                </div>

                {/* Operations & Schedule */}
                <div className="col-span-2 text-[12px] font-bold text-white border-b border-[#292B30] pb-2 mt-2">Operational Details</div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Landscape Manager</label>
                  <select name="managerId" className={inputCls}>
                    <option value="">Select Manager...</option>
                    <option value="mgr-rahul">Rahul S A</option>
                    <option value="mgr-mukesh">Mukesh V</option>
                    <option value="mgr-dinesh">Dinesh Subramanian</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Priority</label>
                  <select name="priority" className={inputCls} defaultValue="Medium">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Start Date</label>
                  <input name="startDate" type="date" className={inputCls} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Expected Completion</label>
                  <input name="expectedCompletion" type="date" className={inputCls} />
                </div>

                {/* Financial Value */}
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Landscape Value (₹)</label>
                  <input name="value" type="number" className={inputCls} placeholder="680000" />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Description / Notes</label>
                  <textarea name="description" rows={3} className={inputCls} placeholder="Details on plantation, irrigation setup, lawn layout..." />
                </div>

              </div>
            )}
          </form>

          {/* Footer */}
          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] bg-[#111113] flex items-center justify-between">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="create-landscape-form" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)] disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Landscape'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';
