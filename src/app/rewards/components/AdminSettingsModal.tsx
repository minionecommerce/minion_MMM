'use client';

import { useState } from 'react';
import { X, Settings, Save, Shield } from 'lucide-react';

interface AdminSettingsModalProps {
  onClose: () => void;
}

export default function AdminSettingsModal({ onClose }: AdminSettingsModalProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[550px] shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1b1e] border border-[#292B30] flex items-center justify-center">
                <Settings className="w-4 h-4 text-gray-300" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Rewards Engine Settings</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {saved ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-4xl mb-2">⚙️</div>
                <h3 className="text-white font-bold uppercase text-[15px]">Settings Saved!</h3>
                <p className="text-green-400 text-[12px]">Reward rules and parameters updated successfully.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Revenue Recognition Policy</label>
                  <select className={inputCls} defaultValue="DEAL_WON">
                    <option value="DEAL_WON">Confirmed Won Deals (CRM)</option>
                    <option value="INVOICE">Issued Invoices</option>
                    <option value="PAYMENT_RECEIVED">Realized Payments Received</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Bike Target (₹)</label>
                    <input type="number" defaultValue="2200000" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Car Target (₹)</label>
                    <input type="number" defaultValue="10000000" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Min Start Meetings</label>
                    <input type="number" defaultValue="70" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Min Impact Points</label>
                    <input type="number" defaultValue="50" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {!saved && (
              <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)]">
                  Save Settings
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
