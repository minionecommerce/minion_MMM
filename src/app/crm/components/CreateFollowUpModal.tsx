'use client';

import { useState, useTransition } from 'react';
import { X, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createFollowUp } from '@/app/actions/crm';

interface CreateFollowUpModalProps {
  leads: any[];
  employees: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const followUpTypes = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Site Visit'];

export default function CreateFollowUpModal({ leads, employees, onClose, onSuccess }: CreateFollowUpModalProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState('Call');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const customerId = selectedLead?.customerId || selectedLead?.customer?.id;

  const handleSubmit = () => {
    if (!selectedLeadId || !assignedToId || !date) {
      setError('Lead, assigned person, and date are required.');
      return;
    }
    if (!customerId) {
      setError('Selected lead has no associated customer.');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const scheduledDate = new Date(`${date}T${time || '10:00'}`);
        const result = await createFollowUp({
          customerId,
          leadId: selectedLeadId,
          assignedToId,
          scheduledDate: scheduledDate.toISOString(),
          type,
          purpose: purpose.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (result.success) {
          setSubmitted(true);
          setTimeout(() => onSuccess(), 1500);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to create follow-up');
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">New Follow-up</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <p className="text-[15px] font-bold text-white">Follow-up Created!</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[12px] text-red-400">{error}</span>
                  </div>
                )}

                <div>
                  <Label>Lead / Customer *</Label>
                  <SelectField
                    value={selectedLeadId}
                    onChange={setSelectedLeadId}
                    options={leads.map(l => l.id)}
                    optionLabels={leads.map(l => `${l.customer?.name || l.leadNumber || l.id.slice(0,8)} · ${l.status}`)}
                    placeholder="Select lead..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <SelectField value={type} onChange={setType} options={followUpTypes} />
                  </div>
                  <div>
                    <Label>Assigned To *</Label>
                    <SelectField
                      value={assignedToId}
                      onChange={setAssignedToId}
                      options={employees.map(e => e.id)}
                      optionLabels={employees.map(e => e.user?.name || 'Unknown')}
                      placeholder="Select person..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Purpose</Label>
                  <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Discuss preliminary quote" className={inputCls} />
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className={`${inputCls} resize-none`} />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !selectedLeadId || !assignedToId || !date}
                    className="flex-1 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isPending ? 'Creating...' : 'Create Follow-up'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{children}</label>;
}

function SelectField({ value, onChange, options, optionLabels, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  optionLabels?: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o, i) => <option key={o} value={o}>{optionLabels ? optionLabels[i] : o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
    </div>
  );
}
