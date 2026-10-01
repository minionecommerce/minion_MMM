'use client';

import { useState } from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { createAchievement } from '../actions';

interface RequestReviewModalProps {
  onClose: () => void;
}

export default function RequestReviewModal({ onClose }: RequestReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Submit review request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
              </div>
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Request Milestone Review</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-white font-bold uppercase text-[15px]">Review Request Submitted!</h3>
                <p className="text-yellow-400 text-[12px]">Management & HR will review your milestone eligibility.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 text-[12px] text-yellow-300">
                  <p className="font-bold mb-1">✓ Revenue & Participation Requirements Met</p>
                  <p className="text-gray-400 text-[11px]">Your request will be submitted to HR & Management for reward verification and fulfillment.</p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Remarks / Notes</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50"
                    placeholder="e.g. Completed ₹22L revenue threshold and all meeting attendance requirements."
                  />
                </div>
              </div>
            )}

            {!submitted && (
              <div className="pt-4 border-t border-[#292B30] flex items-center justify-between">
                <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all shadow-[0_0_15px_rgba(255,196,0,0.2)] disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </>
  );
}
