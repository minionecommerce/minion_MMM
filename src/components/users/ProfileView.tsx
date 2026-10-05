'use client';

import Link from 'next/link';
import { Crown, ShieldCheck, Mail, Phone, Building2, Briefcase, IdCard, Calendar, Clock, KeyRound, Lock, Pencil, Shield, UserX, UserCheck, Tag } from 'lucide-react';
import { PermissionMatrix } from '@/components/users/PermissionMatrix';
import { StatusBadge, useUserActionDialogs } from '@/components/users/UserActions';
import type { UserProfile } from '@/lib/users/queries';
import { accessLabel, displayCustomValue, renamedLabel, type UserLayout } from '@/lib/users/layout-shared';

const fmt = (iso: string | null, withTime = false) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }) : '—';

const ACTION_LABEL: Record<string, string> = {
  USER_CREATED: 'Account created', USER_UPDATED: 'Details updated', ROLE_CHANGED: 'Role changed', ACCESS_CHANGED: 'Access changed', PERMISSIONS_CHANGED: 'Permissions changed',
  PASSWORD_RESET: 'Password reset by admin', PASSWORD_CHANGED: 'Password changed', USER_ACTIVATED: 'Account activated',
  USER_DEACTIVATED: 'Account deactivated', USER_SUSPENDED: 'Account suspended', USER_DELETED: 'Account deleted', LOGIN: 'Signed in',
  LOGOUT: 'Signed out', FAILED_LOGIN: 'Failed sign-in', ACCOUNT_LOCKED: 'Account locked', ACCESS_DENIED: 'Access denied',
};

export function ProfileView({ profile, isSelf, abilities, layout }: {
  layout?: UserLayout; // field names from Users → Edit Page Layout
  profile: UserProfile;
  isSelf: boolean;
  abilities?: { canEdit: boolean; canDelete: boolean; isSuperAdmin: boolean };
}) {
  const actions = useUserActionDialogs(abilities ?? { canEdit: false, canDelete: false, isSuperAdmin: false });
  const target = { id: profile.id, name: profile.name, status: profile.status, isSelf, privileged: profile.isSuperAdmin || profile.isAdmin };
  const can = abilities ? actions.allowed(target) : null;
  const btn = 'flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#292B30] text-[12px] font-semibold text-gray-200 hover:bg-[#1a1b1e]';

  const fields = [
    { icon: IdCard, label: renamedLabel(layout, 'employeeCode', 'Employee ID'), value: profile.employeeCode },
    { icon: Mail, label: renamedLabel(layout, 'email', 'Email'), value: profile.email },
    { icon: Phone, label: renamedLabel(layout, 'phone', 'Phone'), value: profile.phone },
    { icon: Building2, label: renamedLabel(layout, 'departmentId', 'Department'), value: profile.department },
    { icon: Briefcase, label: renamedLabel(layout, 'designation', 'Designation'), value: profile.designation },
    // The fields added with New Field, in the order set in Edit Page Layout
    ...(layout?.fields ?? []).filter(f => !f.isSystem).map(f => ({ icon: Tag, label: f.label, value: displayCustomValue(f, profile.customFields[f.key]) })),
    { icon: Calendar, label: 'Created', value: fmt(profile.createdAt) },
    { icon: Clock, label: 'Last login', value: profile.lastLoginAt ? fmt(profile.lastLoginAt, true) : 'Never' },
    { icon: KeyRound, label: 'Password changed', value: fmt(profile.passwordChangedAt, true) },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#3B2E15] flex items-center justify-center text-[30px] font-black text-yellow-400 shrink-0" aria-label="Profile photo">
          {(profile.name || profile.email || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] font-black truncate">{profile.name || '—'}</h2>
            <StatusBadge status={profile.status} />
            {profile.lockedUntil && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold"><Lock className="w-3 h-3" /> LOCKED</span>}
            {profile.mustChangePassword && <span className="px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">MUST CHANGE PASSWORD</span>}
          </div>
          <div className="text-[13px] text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">{profile.isSuperAdmin && <Crown className="w-3.5 h-3.5 text-yellow-400" />}{accessLabel(layout, profile)}</span>
            {profile.isAdmin && <span className="flex items-center gap-1 text-yellow-400"><ShieldCheck className="w-3.5 h-3.5" /> Full Administrator</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSelf && <Link href="/account/change-password" className={btn}><KeyRound className="w-3.5 h-3.5" /> Change Password</Link>}
          {can?.edit && <Link href={`/users/${profile.id}/edit`} className={btn}><Pencil className="w-3.5 h-3.5" /> Edit User</Link>}
          {can?.permissions && <Link href={`/users/${profile.id}/permissions`} className={btn}><Shield className="w-3.5 h-3.5" /> Edit Permissions</Link>}
          {can?.reset && <button onClick={() => actions.open(target, { kind: 'reset' })} className={btn}><KeyRound className="w-3.5 h-3.5" /> Reset Password</button>}
          {can?.status && profile.status === 'ACTIVE' && <button onClick={() => actions.open(target, { kind: 'status', status: 'INACTIVE' })} className={`${btn} text-red-300 border-red-500/30`}><UserX className="w-3.5 h-3.5" /> Deactivate Account</button>}
          {can?.status && profile.status !== 'ACTIVE' && <button onClick={() => actions.open(target, { kind: 'status', status: 'ACTIVE' })} className={`${btn} text-green-300 border-green-500/30`}><UserCheck className="w-3.5 h-3.5" /> Activate Account</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6 min-w-0">
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <f.icon className="w-4 h-4 text-gray-500 mt-0.5" />
                <div><div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{f.label}</div><div className="text-[13px] text-white">{f.value || '—'}</div></div>
              </div>
            ))}
          </div>
          <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 space-y-4">
            <h3 className="text-[14px] font-bold">Effective Permissions</h3>
            {profile.effectivePermissions.includes('*') ? (
              <div className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-[13px] text-yellow-200">Every permission ({profile.isSuperAdmin ? 'Super Admin Access' : 'Full Administrator Access'}).</div>
            ) : (
              <PermissionMatrix mode="readonly" effective={profile.effectivePermissions} />
            )}
          </div>
        </div>
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 h-fit">
          <h3 className="text-[14px] font-bold mb-4">Recent Activity</h3>
          {profile.activity.length === 0 ? (
            <p className="text-[12px] text-gray-500">No activity recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {profile.activity.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.action === 'FAILED_LOGIN' || a.action === 'ACCESS_DENIED' || a.action === 'ACCOUNT_LOCKED' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="min-w-0">
                    <div className="text-[12px] text-gray-200">{ACTION_LABEL[a.action] ?? a.action}{!a.selfInitiated && a.actorName !== 'System' ? <span className="text-gray-500"> by {a.actorName}</span> : null}</div>
                    <div className="text-[11px] text-gray-500">{fmt(a.createdAt, true)}{a.ip ? ` · ${a.ip}` : ''}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      {actions.dialog}
    </div>
  );
}
