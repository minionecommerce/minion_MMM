'use client';

import { useState } from 'react';
import { X, ClipboardCheck } from 'lucide-react';
import { createSiteInspection } from '../actions';

interface SiteInspectionModalProps {
  landscapes: any[];
  onClose: () => void;
}

export default function SiteInspectionModal({ landscapes, onClose }: SiteInspectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(90);

  const [scores, setScores] = useState({
    plantHealthScore: 90,
    irrigationScore: 90,
    soilScore: 90,
    cleanlinessScore: 90,
    safetyScore: 90,
  });

  const handleScoreChange = (key: string, val: number) => {
    const updated = { ...scores, [key]: val };
    setScores(updated);
    const avg = Math.round((updated.plantHealthScore + updated.irrigationScore + updated.soilScore + updated.cleanlinessScore + updated.safetyScore) / 5);
    setCalculatedScore(avg);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createSiteInspection(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert(res.error || 'Failed to record inspection');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[600px] flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Record Site Inspection</h2>
                <div className="text-[11px] font-mono text-blue-400/60 mt-0.5">Calculated Overall Score: {calculatedScore}%</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="site-inspection-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {submitted ? (
              <div className="py-12 text-center space-y-2">
                <div className="text-4xl mb-2">⭐</div>
                <h3 className="text-white font-bold uppercase text-[16px]">Inspection Recorded!</h3>
                <p className="text-blue-400 text-[13px] font-bold">Overall Site Health Updated: {calculatedScore}%</p>
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
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Inspection Date</label>
                    <input name="date" type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Weather Condition</label>
                    <input name="weather" className={inputCls} defaultValue="Sunny / Clear" />
                  </div>
                </div>

                {/* Score Sliders */}
                <div className="bg-[#0D0D0F] border border-[#292B30] rounded-xl p-4 space-y-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Inspection Checklist Scores (0 - 100%)</div>

                  <ScoreInput label="Plant Health" name="plantHealthScore" value={scores.plantHealthScore} onChange={v => handleScoreChange('plantHealthScore', v)} />
                  <ScoreInput label="Irrigation System" name="irrigationScore" value={scores.irrigationScore} onChange={v => handleScoreChange('irrigationScore', v)} />
                  <ScoreInput label="Soil & Fertilization" name="soilScore" value={scores.soilScore} onChange={v => handleScoreChange('soilScore', v)} />
                  <ScoreInput label="Cleanliness & Weeds" name="cleanlinessScore" value={scores.cleanlinessScore} onChange={v => handleScoreChange('cleanlinessScore', v)} />
                  <ScoreInput label="Safety & Infrastructure" name="safetyScore" value={scores.safetyScore} onChange={v => handleScoreChange('safetyScore', v)} />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1.5">Inspector Remarks & Action Items</label>
                  <textarea name="remarks" rows={3} className={inputCls} placeholder="Observed issues, replacement recommendations, pest alerts..." />
                </div>
              </>
            )}
          </form>

          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] bg-[#111113] flex items-center justify-between">
              <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-[12px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="site-inspection-form" disabled={loading} className="px-6 py-2.5 rounded-lg text-[12px] font-bold bg-blue-400 hover:bg-blue-300 text-black transition-all shadow-[0_0_15px_rgba(96,165,250,0.2)] disabled:opacity-50">
                {loading ? 'Submitting...' : 'Save Inspection'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function ScoreInput({ label, name, value, onChange }: { label: string; name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-gray-300 font-semibold w-36">{label}</span>
      <input 
        name={name}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="flex-1 accent-yellow-400 bg-[#151619]"
      />
      <span className="text-[12px] font-bold font-mono text-yellow-400 w-10 text-right">{value}%</span>
    </div>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors';
