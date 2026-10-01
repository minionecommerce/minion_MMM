'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Power, Trash2 } from 'lucide-react';
import { PermissionMatrix } from '@/components/users/PermissionMatrix';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import type { RoleSummary } from '@/lib/users/queries';

export default function RoleEditor({ role, editable, grantable, ownRole }: { role: RoleSummary; editable: boolean; grantable: string[]; ownRole: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const [busy, setBusy] = useState<'' | 'save' | 'toggle' | 'delete'>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (kind: 'save' | 'toggle' | 'delete') => {
    setBusy(kind);
    try {
      if (kind === 'save') {
        await callApi(`/api/roles/${role.id}/permissions`, 'PUT', { permissions: selected });
        toast.success('Role permissions saved. Everyone with this role gets them on their next action.');
        router.refresh();
      } else if (kind === 'toggle') {
        await callApi(`/api/roles/${role.id}`, 'PATCH', { isActive: !role.isActive });
        toast.success(role.isActive ? 'Role deactivated' : 'Role activated');
        router.refresh();
      } else {
        await callApi(`/api/roles/${role.id}`, 'DELETE');
        toast.success('Role deleted');
        router.push('/users/roles');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy('');
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      {!editable && (
        <div className="p-4 rounded-lg bg-[#151619] border border-[#292B30] text-[13px] text-gray-400">
          {ownRole ? 'This is your own role, so you cannot change it.' : role.isSuperAdmin ? 'Only a Super Admin can change the Super Admin role.' : 'You have read-only access to roles.'}
        </div>
      )}
      <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 sm:p-6 space-y-5">
        {role.isSuperAdmin ? (
          <div className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-[13px] text-yellow-200">The Super Admin role always has every permission and cannot be restricted.</div>
        ) : (
          <PermissionMatrix mode="role" selected={selected} onChange={setSelected} grantable={grantable} disabled={!editable} />
        )}
        {editable && (
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-3">
              {!role.isSystem && (
                <button onClick={() => run('toggle')} disabled={!!busy} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e]">
                  {busy === 'toggle' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />} {role.isActive ? 'Deactivate Role' : 'Activate Role'}
                </button>
              )}
              {!role.isSystem && !role.isSuperAdmin && (
                <button onClick={() => setConfirmDelete(true)} disabled={!!busy} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-[13px] font-semibold text-red-300 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" /> Delete Role
                </button>
              )}
            </div>
            {!role.isSuperAdmin && (
              <button onClick={() => run('save')} disabled={!!busy} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Permissions
              </button>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete role?"
        message={role.userCount ? `This role is assigned to ${role.userCount} user(s). Reassign them before deleting.` : `"${role.name}" will be permanently deleted.`}
        confirmLabel="Delete Role"
        danger
        busy={busy === 'delete'}
        onConfirm={() => run('delete')}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
