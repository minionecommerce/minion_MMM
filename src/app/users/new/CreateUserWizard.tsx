'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2, Search, UserPlus, Users, ShieldCheck, Crown } from 'lucide-react';
import { PermissionMatrix, overridesToPayload, type OverrideMap } from '@/components/users/PermissionMatrix';
import { PasswordInput } from '@/components/users/PasswordInput';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import { isStrongPassword } from '@/lib/password-policy';
import type { RoleSummary } from '@/lib/users/queries';

type Employee = { id: string; name: string; email: string; employeeCode: string; designation: string; phone: string; departmentId: string; department: string };

const STEPS = ['Employee', 'Details', 'Role', 'Permissions', 'Credentials', 'Review'] as const;
const inputClass = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none';
const labelClass = 'block text-[12px] font-semibold text-gray-400 mb-1.5';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUserWizard({ roles, departments, employees, actor }: {
  roles: RoleSummary[];
  departments: { id: string; name: string }[];
  employees: Employee[];
  actor: { isSuperAdmin: boolean; permissions: string[]; canEditPermissions: boolean };
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<'new' | 'existing'>(employees.length ? 'existing' : 'new');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [details, setDetails] = useState({ fullName: '', employeeCode: '', email: '', phone: '', departmentId: '', designation: '' });
  const [roleId, setRoleId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const role = roles.find(r => r.id === roleId);
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.toLowerCase();
    return employees.filter(e => !q || e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
  }, [employees, employeeSearch]);

  const selectEmployee = (e: Employee) => {
    setEmployeeId(e.id);
    setDetails({ fullName: e.name, employeeCode: e.employeeCode, email: e.email, phone: e.phone, departmentId: e.departmentId, designation: e.designation });
  };

  const changeRole = (id: string) => {
    setRoleId(id);
    setOverrides({}); // custom permissions are relative to the role
  };

  const stepError = (s: number): string => {
    if (s === 0 && mode === 'existing' && !employeeId) return 'Select an employee, or choose "New employee".';
    if (s === 1) {
      if (details.fullName.trim().length < 2) return 'Full name is required.';
      if (!EMAIL_RE.test(details.email.trim())) return 'Enter a valid email address.';
    }
    if (s === 2 && !roleId) return 'Select a role.';
    if (s === 4) {
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
        employeeId: mode === 'existing' ? employeeId : null,
        fullName: details.fullName,
        employeeCode: details.employeeCode || null,
        email: details.email,
        phone: details.phone || null,
        departmentId: details.departmentId || null,
        designation: details.designation || null,
        roleId,
        ...(actor.isSuperAdmin ? { isAdmin } : {}),
        overrides: overridesToPayload(overrides),
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

  const added = Object.values(overrides).filter(v => v === 'ALLOW').length;
  const removed = Object.values(overrides).filter(v => v === 'DENY').length;
  const deptName = departments.find(d => d.id === details.departmentId)?.name;

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
            <h2 className="text-[16px] font-bold">Select Employee</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([['existing', Users, 'Existing employee', `${employees.length} without a login`], ['new', UserPlus, 'New employee', 'Create the employee and login together']] as const).map(([value, Icon, title, sub]) => (
                <button key={value} type="button" onClick={() => { setMode(value); if (value === 'new') { setEmployeeId(''); } }}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left ${mode === value ? 'border-yellow-400 bg-yellow-400/5' : 'border-[#292B30] hover:border-gray-500'}`}>
                  <Icon className={`w-5 h-5 mt-0.5 ${mode === value ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <div><div className="text-[14px] font-bold">{title}</div><div className="text-[12px] text-gray-500">{sub}</div></div>
                </button>
              ))}
            </div>
            {mode === 'existing' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Search employees…" aria-label="Search employees" className={`${inputClass} pl-10`} />
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#1e2025] border border-[#292B30] rounded-lg">
                  {filteredEmployees.length === 0 && <div className="p-6 text-center text-[13px] text-gray-500">No employees without a login{employeeSearch ? ' match your search' : ''}.</div>}
                  {filteredEmployees.map(e => (
                    <button key={e.id} type="button" onClick={() => selectEmployee(e)} className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left ${employeeId === e.id ? 'bg-yellow-400/10' : 'hover:bg-[#1a1b1e]'}`}>
                      <div>
                        <div className="text-[13px] font-semibold">{e.name || 'Unnamed'}</div>
                        <div className="text-[11px] text-gray-500">{[e.employeeCode, e.designation, e.department].filter(Boolean).join(' · ') || 'No details'}</div>
                      </div>
                      {employeeId === e.id && <Check className="w-4 h-4 text-yellow-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-[16px] font-bold">Employee & Login Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClass}>Full Name *</label><input className={inputClass} value={details.fullName} onChange={e => setDetails({ ...details, fullName: e.target.value })} /></div>
              <div><label className={labelClass}>Employee ID</label><input className={inputClass} placeholder="e.g. MIN-0012" value={details.employeeCode} onChange={e => setDetails({ ...details, employeeCode: e.target.value })} /></div>
              <div><label className={labelClass}>Email / Username *</label><input type="email" autoComplete="off" className={inputClass} value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} /><p className="text-[11px] text-gray-500 mt-1">Used to sign in.</p></div>
              <div><label className={labelClass}>Phone Number</label><input className={inputClass} value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} /></div>
              <div>
                <label className={labelClass}>Department</label>
                <select className={inputClass} value={details.departmentId} onChange={e => setDetails({ ...details, departmentId: e.target.value })}>
                  <option value="">— None —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Designation</label><input className={inputClass} value={details.designation} onChange={e => setDetails({ ...details, designation: e.target.value })} /></div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <h2 className="text-[16px] font-bold">Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map(r => (
                <button key={r.id} type="button" onClick={() => changeRole(r.id)} className={`p-4 rounded-xl border text-left ${roleId === r.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-[#292B30] hover:border-gray-500'}`}>
                  <div className="flex items-center gap-2 text-[14px] font-bold">{r.isSuperAdmin && <Crown className="w-4 h-4 text-yellow-400" />}{r.name}</div>
                  <div className="text-[12px] text-gray-500 mt-1">{r.description || (r.isSuperAdmin ? 'Every permission' : `${r.permissions.length} permissions`)}</div>
                </button>
              ))}
            </div>
            {actor.isSuperAdmin && (
              <div className="border-t border-[#292B30] pt-5">
                <h3 className="text-[13px] font-bold text-gray-300 mb-2">Admin Access</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="mt-1 w-4 h-4 accent-yellow-400" />
                  <span>
                    <span className="text-[13px] font-semibold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-yellow-400" /> Full Administrator Access</span>
                    <span className="block text-[12px] text-gray-500">Access to every CRM module, including Users and Settings. Cannot manage Super Admins. Enforced on the server; only Super Admins can grant it.</span>
                  </span>
                </label>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-[16px] font-bold">Permissions</h2>
              <p className="text-[12px] text-gray-500 mt-1">
                Starts from the <b className="text-gray-300">{role?.name}</b> role. Click a cell to add or remove a permission for this user only.
              </p>
            </div>
            {role?.isSuperAdmin || isAdmin ? (
              <div className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-[13px] text-yellow-200">This user will have every permission ({role?.isSuperAdmin ? 'Super Admin role' : 'Full Administrator Access'}). User-specific permissions do not apply.</div>
            ) : !actor.canEditPermissions ? (
              <div className="p-4 rounded-lg bg-[#0D0D0F] border border-[#292B30] text-[13px] text-gray-400">You can assign a role, but changing user-specific permissions requires Users → Edit.</div>
            ) : (
              <PermissionMatrix mode="user" roleKeys={role?.permissions ?? []} overrides={overrides} onChange={setOverrides} grantable={actor.permissions} />
            )}
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4 max-w-xl">
            <h2 className="text-[16px] font-bold">Login Credentials</h2>
            <div><label className={labelClass}>Username / Email</label><input className={`${inputClass} opacity-70`} value={details.email} readOnly /></div>
            <PasswordInput value={password} onChange={setPassword} confirm={confirm} onConfirmChange={setConfirm} />
            <p className="text-[11px] text-gray-500">Passwords are hashed with bcrypt before saving. Nobody, including administrators, can read them afterwards.</p>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <h2 className="text-[16px] font-bold">Review</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              {[
                ['Employee', mode === 'existing' ? 'Existing employee (linked)' : 'New employee'],
                ['Full name', details.fullName],
                ['Employee ID', details.employeeCode || '—'],
                ['Email / Username', details.email],
                ['Phone', details.phone || '—'],
                ['Department', deptName || '—'],
                ['Designation', details.designation || '—'],
                ['Role', role?.name ?? '—'],
                ['Full Administrator', isAdmin ? 'Yes' : 'No'],
                ['Custom permissions', added || removed ? `${added} added, ${removed} removed` : 'None (role defaults)'],
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
