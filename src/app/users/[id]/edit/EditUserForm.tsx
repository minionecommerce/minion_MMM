'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import type { UserProfile } from '@/lib/users/queries';

const inputClass = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none disabled:opacity-50';
const labelClass = 'block text-[12px] font-semibold text-gray-400 mb-1.5';

export default function EditUserForm({ profile, roles, departments, isSelf, actorIsSuperAdmin }: {
  profile: UserProfile;
  roles: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  isSelf: boolean;
  actorIsSuperAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: profile.name ?? '',
    email: profile.email ?? '',
    employeeCode: profile.employeeCode ?? '',
    phone: profile.phone ?? '',
    departmentId: profile.departmentId ?? '',
    designation: profile.designation ?? '',
    roleId: profile.roleId ?? '',
    isAdmin: profile.isAdmin,
  });
  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await callApi(`/api/users/${profile.id}`, 'PATCH', {
        fullName: form.fullName,
        email: form.email,
        employeeCode: form.employeeCode || null,
        phone: form.phone || null,
        departmentId: form.departmentId || null,
        designation: form.designation || null,
        // Only send what may change; the server rejects the rest anyway
        ...(!isSelf && form.roleId && form.roleId !== profile.roleId ? { roleId: form.roleId } : {}),
        ...(!isSelf && actorIsSuperAdmin && form.isAdmin !== profile.isAdmin ? { isAdmin: form.isAdmin } : {}),
      });
      toast.success('User updated');
      router.push(`/users/${profile.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 sm:p-6 space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelClass}>Full Name</label><input className={inputClass} value={form.fullName} onChange={e => set('fullName', e.target.value)} required minLength={2} /></div>
        <div><label className={labelClass}>Employee ID</label><input className={inputClass} value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} /></div>
        <div><label className={labelClass}>Email / Username</label><input type="email" className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} required /></div>
        <div><label className={labelClass}>Phone Number</label><input className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div>
          <label className={labelClass}>Department</label>
          <select className={inputClass} value={form.departmentId} onChange={e => set('departmentId', e.target.value)}>
            <option value="">— None —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div><label className={labelClass}>Designation</label><input className={inputClass} value={form.designation} onChange={e => set('designation', e.target.value)} /></div>
        <div>
          <label className={labelClass}>Role</label>
          <select className={inputClass} value={form.roleId} onChange={e => set('roleId', e.target.value)} disabled={isSelf}>
            {!profile.roleId && <option value="">— No role —</option>}
            {profile.roleId && !roles.some(r => r.id === profile.roleId) && <option value={profile.roleId}>{profile.roleName}</option>}
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {isSelf && <p className="text-[11px] text-gray-500 mt-1">You cannot change your own role.</p>}
        </div>
        {actorIsSuperAdmin && (
          <label className={`flex items-start gap-3 mt-6 ${isSelf ? 'opacity-50' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={form.isAdmin} disabled={isSelf} onChange={e => set('isAdmin', e.target.checked)} className="mt-1 w-4 h-4 accent-yellow-400" />
            <span><span className="text-[13px] font-semibold">Full Administrator Access</span><span className="block text-[11px] text-gray-500">Every module, including Users and Settings.</span></span>
          </label>
        )}
      </div>
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[13px] text-red-300" role="alert">{error}</div>}
      <div className="flex justify-end gap-3">
        <Link href={`/users/${profile.id}`} className="px-4 py-2.5 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e]">Cancel</Link>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>
    </form>
  );
}
