'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import type { UserProfile } from '@/lib/users/queries';
import { SUPER_ADMIN_ACCESS_ID, customFromForm, customToForm, fieldLabel, firstMissingField, type UserFieldKey, type UserLayout } from '@/lib/users/layout-shared';
import UserFormFields from '../../components/UserFormFields';

// The Access level a person has now, as an option id of the Access field. Accounts that predate access levels have none
// saved: the first level that gives their role is shown instead.
function currentAccess(profile: UserProfile, layout: UserLayout) {
  if (profile.isSuperAdmin) return SUPER_ADMIN_ACCESS_ID;
  const options = layout.fields.find(f => f.key === 'access')?.options ?? [];
  if (profile.accessId && options.some(o => o.id === profile.accessId)) return profile.accessId;
  return options.find(o => !o.locked && o.roleId && o.roleId === profile.roleId)?.id ?? '';
}

export default function EditUserForm({ profile, departments, isSelf, layout }: {
  layout: UserLayout; // field order, labels, required flags and the Access levels from Users → Edit Page Layout
  profile: UserProfile;
  departments: { id: string; name: string }[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const startAccess = currentAccess(profile, layout);
  const [form, setForm] = useState({
    fullName: profile.name ?? '',
    email: profile.email ?? '',
    employeeCode: profile.employeeCode ?? '',
    phone: profile.phone ?? '',
    departmentId: profile.departmentId ?? '',
    designation: profile.designation ?? '',
    access: startAccess,
    isAdmin: profile.isAdmin,
  });
  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  // The fields added with New Field (a checkbox is "true" when ticked)
  const [custom, setCustom] = useState<Record<string, string>>(() =>
    Object.fromEntries(layout.fields.filter(f => !f.isSystem).map(f => [f.key, customToForm(profile.customFields[f.key])])));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.access) { setError(`${fieldLabel(layout, 'access')} is required.`); return; }
    const missing = firstMissingField(layout.fields, form, custom);
    if (missing) { setError(missing); return; }
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
        customFields: Object.fromEntries(layout.fields.filter(f => !f.isSystem).map(f => [f.key, customFromForm(f, custom[f.key])])),
        // Only send what may change; the server rejects the rest anyway
        ...(!isSelf && form.access !== startAccess ? { accessId: form.access } : {}),
        ...(!isSelf && form.isAdmin !== profile.isAdmin ? { isAdmin: form.isAdmin } : {}),
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
        <UserFormFields idPrefix="edit-user" fields={layout.fields} values={form} custom={custom} departments={departments}
          disabledKeys={isSelf ? ['access'] : []} hints={isSelf ? { access: 'You cannot change your own Access.' } : {}}
          onChange={(f, v) => (f.isSystem ? set(f.key as UserFieldKey, v) : setCustom(c => ({ ...c, [f.key]: v })))} />
        <label className={`flex items-start gap-3 mt-6 ${isSelf ? 'opacity-50' : 'cursor-pointer'}`}>
          <input type="checkbox" checked={form.isAdmin} disabled={isSelf} onChange={e => set('isAdmin', e.target.checked)} className="mt-1 w-4 h-4 accent-yellow-400" />
          <span><span className="text-[13px] font-semibold">Full Administrator Access</span><span className="block text-[11px] text-gray-500">Every module, but none of the Super Admin features (accounts, credentials, roles, page layout).</span></span>
        </label>
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
