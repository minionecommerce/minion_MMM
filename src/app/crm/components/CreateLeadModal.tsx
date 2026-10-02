'use client';

import { useState, useTransition } from 'react';
import { X, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createLead, checkDuplicateCustomer } from '@/app/actions/crm';

const customerTypes = ['Individual', 'Company', 'Builder', 'Architect', 'Interior Designer', 'Contractor'];
const leadSources = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Exhibition', 'Cold Call', 'Google Ads'];
const propertyTypes = ['Villa', 'Apartment', 'Independent House', 'Office', 'Restaurant', 'Commercial', 'Builder Project'];
const budgetRanges = ['₹0–2L', '₹2–4L', '₹4–6L', '₹6–8L', '₹8–10L', '₹10–15L', '₹15L+'];
const leadPriorities = ['Low', 'Medium', 'High'];
const services = ['Home Automation', 'Interior Design', 'Landscaping', 'Security', 'Garden Automation', 'False Ceiling', 'Plumbing', 'Electrical'];

interface CreateLeadModalProps {
  employees: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateLeadModal({ employees, onClose, onSuccess }: CreateLeadModalProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLeadNumber, setNewLeadNumber] = useState('');
  const [duplicateCustomer, setDuplicateCustomer] = useState<any | null>(null);
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState('Individual');
  const [source, setSource] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [requirement, setRequirement] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [siteVisitRequired, setSiteVisitRequired] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('Call Customer');
  const [salesExecId, setSalesExecId] = useState('');
  const [expectedValue, setExpectedValue] = useState('');

  const toggleService = (svc: string) => {
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const handlePhoneBlur = async () => {
    if (phone.trim().length >= 10) {
      const dupe = await checkDuplicateCustomer(phone.trim(), email.trim() || undefined);
      if (dupe) {
        setDuplicateCustomer(dupe);
      } else {
        setDuplicateCustomer(null);
        setExistingCustomerId(null);
      }
    }
  };

  const handleSubmit = () => {
    if (!customerName.trim() || !phone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const result = await createLead({
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          customerType,
          existingCustomerId: existingCustomerId || undefined,
          siteLocation: siteLocation.trim() || undefined,
          propertyType: propertyType || undefined,
          requirement: requirement.trim() || undefined,
          services: selectedServices,
          budgetRange: budget || undefined,
          source: source || 'Website',
          priority,
          siteVisitRequired: siteVisitRequired === 'Yes',
          notes: notes.trim() || undefined,
          nextAction: nextAction.trim() || 'Call Customer',
          expectedValue: expectedValue ? Number(expectedValue) : undefined,
          salesExecutiveId: salesExecId || undefined,
        });
        
        if (result.success) {
          setNewLeadNumber(result.lead.leadNumber || '');
          setSubmitted(true);
          setTimeout(() => onSuccess(), 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to create lead. Please try again.');
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <div>
                <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">New Lead</h2>
                {newLeadNumber && <div className="text-[11px] font-mono text-yellow-400/60 mt-0.5">{newLeadNumber}</div>}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex border-b border-[#292B30] bg-[#111113]">
            {[{ n: 1, label: 'Customer' }, { n: 2, label: 'Property' }, { n: 3, label: 'Assignment' }].map(s => (
              <button
                key={s.n}
                onClick={() => setStep(s.n)}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
                  step === s.n ? 'text-yellow-400 border-yellow-400' :
                  step > s.n ? 'text-green-400 border-transparent' :
                  'text-gray-500 border-transparent'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  step > s.n ? 'bg-green-500 text-white' :
                  step === s.n ? 'bg-yellow-400 text-black' :
                  'bg-[#292B30] text-gray-500'
                }`}>{step > s.n ? '✓' : s.n}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-[15px] font-bold text-white">Lead Created!</p>
                <p className="text-[12px] text-gray-500 font-mono">{newLeadNumber}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[12px] text-red-400">{error}</span>
                  </div>
                )}

                {/* Duplicate customer warning */}
                {duplicateCustomer && !existingCustomerId && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <div className="text-[12px] font-bold text-orange-400 mb-2">⚠ Possible Existing Customer Found</div>
                    <div className="text-[12px] text-gray-300 mb-3">
                      <span className="font-semibold">{duplicateCustomer.name}</span> · {duplicateCustomer.phone} · {duplicateCustomer.email}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setExistingCustomerId(duplicateCustomer.id); setCustomerName(duplicateCustomer.name); setPhone(duplicateCustomer.phone || phone); setEmail(duplicateCustomer.email || email); setDuplicateCustomer(null); }}
                        className="flex-1 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-[11px] font-semibold hover:bg-orange-500/30 transition"
                      >
                        Use Existing Customer
                      </button>
                      <button
                        onClick={() => { setDuplicateCustomer(null); setExistingCustomerId(null); }}
                        className="flex-1 py-1.5 bg-[#0D0D0F] border border-[#292B30] text-gray-300 rounded-lg text-[11px] font-semibold hover:border-gray-500 transition"
                      >
                        Create New Anyway
                      </button>
                    </div>
                  </div>
                )}
                {existingCustomerId && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-[12px] text-green-400">Using existing customer: <strong>{customerName}</strong></span>
                    <button onClick={() => { setExistingCustomerId(null); }} className="ml-auto text-[11px] text-gray-500 hover:text-red-400">Remove</button>
                  </div>
                )}

                {/* STEP 1: Customer */}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Customer Name *</Label>
                      <input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name or company name" className={inputCls} />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <input required value={phone} onChange={e => setPhone(e.target.value)} onBlur={handlePhoneBlur} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" className={inputCls} />
                    </div>
                    <div>
                      <Label>Customer Type *</Label>
                      <SelectField value={customerType} onChange={setCustomerType} options={customerTypes} />
                    </div>
                    <div>
                      <Label>Lead Source</Label>
                      <SelectField value={source} onChange={setSource} options={leadSources} placeholder="Select source" />
                    </div>
                  </div>
                )}

                {/* STEP 2: Property */}
                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Site Location *</Label>
                      <input required value={siteLocation} onChange={e => setSiteLocation(e.target.value)} placeholder="e.g. Anna Nagar, Chennai" className={inputCls} />
                    </div>
                    <div>
                      <Label>Property Type</Label>
                      <SelectField value={propertyType} onChange={setPropertyType} options={propertyTypes} placeholder="Select type" />
                    </div>
                    <div>
                      <Label>Budget Range</Label>
                      <SelectField value={budget} onChange={setBudget} options={budgetRanges} placeholder="Select budget" />
                    </div>
                    <div>
                      <Label>Expected Value (₹)</Label>
                      <input type="number" value={expectedValue} onChange={e => setExpectedValue(e.target.value)} placeholder="e.g. 500000" className={inputCls} />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <SelectField value={priority} onChange={setPriority} options={leadPriorities} />
                    </div>
                    <div className="col-span-2">
                      <Label>Requirement</Label>
                      <textarea rows={3} value={requirement} onChange={e => setRequirement(e.target.value)} placeholder="Describe the customer's requirement..." className={`${inputCls} resize-none`} />
                    </div>
                    <div className="col-span-2">
                      <Label>Services Required</Label>
                      <div className="flex flex-wrap gap-2">
                        {services.map(svc => (
                          <button
                            type="button"
                            key={svc}
                            onClick={() => toggleService(svc)}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                              selectedServices.includes(svc)
                                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                                : 'bg-[#0D0D0F] border-[#292B30] text-gray-500 hover:border-gray-500'
                            }`}
                          >
                            {svc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Site Visit Required?</Label>
                      <div className="flex items-center gap-2">
                        {['Yes', 'No', 'Maybe'].map(opt => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setSiteVisitRequired(opt)}
                            className={`flex-1 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                              siteVisitRequired === opt ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-[#0D0D0F] border-[#292B30] text-gray-500 hover:border-gray-500'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Assignment */}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sales Executive</Label>
                      <SelectField
                        value={salesExecId}
                        onChange={setSalesExecId}
                        options={employees.map(e => e.id)}
                        optionLabels={employees.map(e => e.user?.name || 'Unknown')}
                        placeholder="Assign to..."
                      />
                    </div>
                    <div>
                      <Label>Next Action</Label>
                      <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Call Customer" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} />
                    </div>

                    {/* Summary */}
                    <div className="col-span-2 bg-[#0D0D0F] border border-[#292B30] rounded-xl p-4 space-y-2">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Lead Summary</div>
                      {[
                        ['Customer', customerName || '—'],
                        ['Phone', phone || '—'],
                        ['Type', customerType],
                        ['Location', siteLocation || '—'],
                        ['Budget', budget || '—'],
                        ['Priority', priority],
                        ['Sales Exec', employees.find(e => e.id === salesExecId)?.user?.name || 'Unassigned'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-semibold text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!submitted && (
            <div className="px-6 py-4 border-t border-[#292B30] bg-[#111113] flex items-center justify-between gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!customerName.trim() || !phone.trim())} className="px-6 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all disabled:opacity-50">
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !customerName.trim() || !phone.trim()}
                    className="px-6 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isPending ? 'Creating...' : 'Create Lead'}
                  </button>
                )}
              </div>
            </div>
          )}
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
