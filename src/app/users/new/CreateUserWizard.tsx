'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import { PasswordInput } from '@/components/users/PasswordInput';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import { isStrongPassword } from '@/lib/password-policy';
import { customDefaults, customFromForm, displayCustomValue, fieldDefaults, fieldLabel, firstMissingField, type UserFieldKey, type UserLayout } from '@/lib/users/layout-shared';
import UserFormFields, { inputClass, labelClass } from '../components/UserFormFields';

// Employee, Role and Permissions are not steps any more: the person is created together with their login, and what they
// may do is set by the Access field in Details (Super Admin, or an access level that carries a role)
const STEPS = ['Details', 'Credentials', 'Review'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUserWizard({ departments, layout }: {
  layout: UserLayout; // field order, labels, required flags, defaults and the Access levels from Users → Edit Page Layout
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const defaults = useMemo(() => fieldDefaults(layout.fields), [layout.fields]);
  const [details, setDetails] = useState(defaults);
  const [custom, setCustom] = useState(() => customDefaults(layout.fields)); // the fields added with New Field
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const stepError = (s: number): string => {
    if (s === 0) {
      if (details.fullName.trim().length < 2) return 'Full name is required.';
      if (!EMAIL_RE.test(details.email.trim())) return 'Enter a valid email address.';
      if (!details.access) return `${fieldLabel(layout, 'access')} is required.`;
      const missing = firstMissingField(layout.fields, details, custom);
      if (missing) return missing;
    }
    if (s === 1) {
      if (!isStrongPassword(password)) return 'Password does not meet all requirements.';
      if (password !== confirm) return 'Passwords do not match.';
    }
    return '';
  };

  const next = () => {
    const e = stepError(step);
    setError(e);
    if (!e) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = stepError(s);
      if (e) { setStep(s); setError(e); return; }
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await callApi('/api/users', 'POST', {
        fullName: details.fullName,
        employeeCode: details.employeeCode || null,
        email: details.email,
        phone: details.phone || null,
        departmentId: details.departmentId || null,
        designation: details.designation || null,
        customFields: Object.fromEntries(layout.fields.filter(f => !f.isSystem).map(f => [f.key, customFromForm(f, custom[f.key])])),
        accessId: details.access,
        password,
      });
      toast.success(`User ${details.fullName} created. They can sign in now.`);
      router.push(`/users/${data.user.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const deptName = departments.find(d => d.id === details.departmentId)?.name;
  const reviewValue = (key: string, isSystem: boolean) => {
    const f = layout.fields.find(x => x.key === key)!;
    if (!isSystem) return displayCustomValue(f, customFromForm(f, custom[key]));
    if (key === 'departmentId') return deptName || '—';
    if (key === 'access') return f.options?.find(o => o.id === details.access)?.label || '—';
    return details[key as UserFieldKey] || '—';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      {/* Stepper */}
      <ol className="flex lg:flex-col gap-2 overflow-x-auto">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] font-semibold whitespace-nowrap ${i === step ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : i < step ? 'text-gray-300 hover:bg-[#1a1b1e]' : 'text-gray-600'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${i < step ? 'bg-yellow-400 text-black' : i === step ? 'border border-yellow-400' : 'border border-[#292B30]'}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 sm:p-6 space-y-6 min-w-0">
        {step === 0 && (
          <section className="space-y-4">
            <h2 className="text-[16px] font-bold">Employee & Login Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UserFormFields idPrefix="new-user" fields={layout.fields} values={details} custom={custom} departments={departments}
                onChange={(f, v) => (f.isSystem ? setDetails(d => ({ ...d, [f.key as UserFieldKey]: v })) : setCustom(c => ({ ...c, [f.key]: v })))} />
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4 max-w-xl">
            <h2 className="text-[16px] font-bold">Login Credentials</h2>
            <div><label className={labelClass}>Username / Email</label><input className={`${inputClass} opacity-70`} value={details.email} readOnly /></div>
            <PasswordInput value={password} onChange={setPassword} confirm={confirm} onConfirmChange={setConfirm} />
            <p className="text-[11px] text-gray-500">Passwords are hashed with bcrypt before saving. Nobody, including administrators, can read them afterwards.</p>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-[16px] font-bold">Review</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              {[
                ...layout.fields.map(f => [f.label, reviewValue(f.key, f.isSystem)]),
                ['Password', '•'.repeat(12) + ' (meets policy)'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[#1e2025] pb-2"><dt className="text-gray-500">{k}</dt><dd className="text-white font-medium text-right">{v}</dd></div>
              ))}
            </dl>
          </section>
        )}

        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[13px] text-red-300" role="alert">{error}</div>}

        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => { setError(''); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0 || submitting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e] disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
