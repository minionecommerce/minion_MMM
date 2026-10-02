'use client';

import { useState } from 'react';
import { useDropdown } from '@/lib/dropdowns/useDropdown';
import { X, Search } from 'lucide-react';
import { ProjectType } from '../data/mock';

import { createProject } from '../actions';

interface CreateProjectModalProps {
  onClose: () => void;
}

const projectTypes: ProjectType[] = ['Smart Home Automation', 'Interior Design', 'Landscaping', 'Home Automation + Interiors', 'Interior + Landscaping', 'Complete Turnkey', 'Commercial Interior', 'Restaurant / Cafe', 'Office', 'Villa', 'Apartment', 'Builder Project', 'Other'];

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const [step, setStep] = useState(1);
  const ddProjectType = useDropdown('PROJECT_TYPE', projectTypes);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const nextProjectId = `PRJ-2026-${String(Math.floor(Math.random() * 1000) + 51).padStart(4, '0')}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProject(formData);
    setLoading(false);
    
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload(); // Quick refresh to show new data
      }, 1500);
    } else {
      alert(res.error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <div>
                <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">New Project</h2>
                <div className="text-[11px] font-mono text-yellow-400/60 mt-0.5">{nextProjectId}</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="create-project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[18px] font-bold text-white uppercase tracking-wider">Project Created!</p>
                <p className="text-[14px] text-gray-400 font-mono">{nextProjectId}</p>
                <p className="text-[12px] text-gray-500 mt-2">Redirecting to project dashboard...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* CRM Import Section */}
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
                  <div className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Import from CRM Deal</span>
                    <span className="text-[9px] text-yellow-400/60 font-medium normal-case">(Recommended)</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400/50" />
                    <input 
                      type="text" 
                      placeholder="Search Deal ID, Customer Name..." 
                      className="w-full bg-[#0D0D0F] border border-yellow-400/20 rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-white placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div className="col-span-2 text-[12px] font-bold text-white border-b border-[#292B30] pb-2 mt-2">Basic Details</div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Project Name *</label>
                    <input name="name" required className={inputCls} placeholder="e.g. Kumar Residence" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Customer *</label>
                    <input name="customerName" required className={inputCls} placeholder="Customer Name" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Project Type *</label>
                    <select name="type" required className={inputCls} key={ddProjectType.ready ? 'ready' : 'loading'} defaultValue={ddProjectType.defaultValue ?? ''}>
                      <option value="">Select type...</option>
                      {ddProjectType.options.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Site Location *</label>
                    <input name="location" required className={inputCls} placeholder="Location" />
                  </div>

                  {/* Operational Details */}
                  <div className="col-span-2 text-[12px] font-bold text-white border-b border-[#292B30] pb-2 mt-4">Operational Details</div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Project Manager</label>
                    <select name="managerId" className={inputCls}>
                      <option value="">Select Manager...</option>
                      <option value="clx_mgr_1">Dinesh Subramanian</option>
                      <option value="clx_mgr_2">Rahul S A</option>
                      <option value="clx_mgr_3">Mukesh V</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Project Coordinator</label>
                    <select className={inputCls}>
                      <option>Rahul S A</option><option>Mukesh V</option><option>Dinesh Subramanian</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Start Date</label>
                    <input name="startDate" type="date" className={inputCls} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Expected Completion</label>
                    <input name="expectedEndDate" type="date" className={inputCls} />
                  </div>

                  {/* Financials */}
                  <div className="col-span-2 text-[12px] font-bold text-white border-b border-[#292B30] pb-2 mt-4">Financials</div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Contract Value (₹)</label>
                    <input name="contractValue" type="number" className={inputCls} placeholder="0" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">GST (₹)</label>
                    <input name="gst" type="number" className={inputCls} placeholder="0" />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input type="checkbox" className="w-4 h-4 rounded bg-[#0D0D0F] border-[#292B30] text-yellow-400 focus:ring-yellow-400/50 focus:ring-offset-0 focus:ring-offset-transparent accent-yellow-400" defaultChecked />
                      <span className="text-[12px] font-semibold text-gray-300">Import BOQ from Quote</span>
                    </label>
                  </div>

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
              <button type="submit" form="create-project-form" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)] disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';
