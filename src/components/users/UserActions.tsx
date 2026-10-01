'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Pencil, Shield, KeyRound, UserX, UserCheck, Ban, Trash2, Copy, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export type ActionTarget = {
  id: string;
  name: string | null;
  status: string;
  isSelf: boolean;
  privileged: boolean; // Super Admin role or Full Administrator
};

type Abilities = { canEdit: boolean; canDelete: boolean; isSuperAdmin: boolean };

type Pending =
  | { kind: 'reset' }
  | { kind: 'status'; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }
  | { kind: 'delete' }
  | null;

export async function callApi(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.details) ? ` (${data.details.map((d: { path: string; message: string }) => `${d.path}: ${d.message}`).join('; ')})` : '';
    throw new Error((data.error || `Request failed (${res.status})`) + details);
  }
  return data;
}

export function useUserActionDialogs(abilities: Abilities, onDone?: () => void) {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const open = (t: ActionTarget, p: NonNullable<Pending>) => {
    setTarget(t);
    setPending(p);
  };

  const run = async () => {
    if (!target || !pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'reset') {
        const data = await callApi(`/api/users/${target.id}/password`, 'POST', {});
        setTempPassword(data.temporaryPassword);
        toast.success('Password reset. All of their sessions were signed out.');
      } else if (pending.kind === 'status') {
        await callApi(`/api/users/${target.id}/status`, 'POST', { status: pending.status });
        toast.success(pending.status === 'ACTIVE' ? 'Account activated' : pending.status === 'SUSPENDED' ? 'Account suspended' : 'Account deactivated');
      } else if (pending.kind === 'delete') {
        await callApi(`/api/users/${target.id}`, 'DELETE');
        toast.success('User deleted');
      }
      setPending(null);
      onDone?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const name = target?.name || 'this user';
  const dialog = (
    <>
      <ConfirmDialog
        open={pending?.kind === 'reset'}
        title="Reset password?"
        message={<>A new temporary password will be generated for <b className="text-white">{name}</b>. They will be signed out everywhere and must choose a new password at next sign-in.</>}
        confirmLabel="Reset Password"
        danger
        busy={busy}
        onConfirm={run}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'status'}
        title={pending?.kind === 'status' && pending.status === 'ACTIVE' ? 'Activate account?' : pending?.kind === 'status' && pending.status === 'SUSPENDED' ? 'Suspend account?' : 'Deactivate account?'}
        message={pending?.kind === 'status' && pending.status === 'ACTIVE'
          ? <><b className="text-white">{name}</b> will be able to sign in again.</>
          : <><b className="text-white">{name}</b> will be signed out immediately and will not be able to sign in.</>}
        confirmLabel={pending?.kind === 'status' && pending.status === 'ACTIVE' ? 'Activate' : pending?.kind === 'status' && pending.status === 'SUSPENDED' ? 'Suspend' : 'Deactivate'}
        danger={!(pending?.kind === 'status' && pending.status === 'ACTIVE')}
        busy={busy}
        onConfirm={run}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'delete'}
        title="Delete user?"
        message={<><b className="text-white">{name}</b> will lose access and be removed from the user list. Their employee record and history are kept. This cannot be undone from the app.</>}
        confirmLabel="Delete User"
        danger
        busy={busy}
        onConfirm={run}
        onCancel={() => setPending(null)}
      />
      {tempPassword && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]" />
          <div className="fixed inset-0 z-[91] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md bg-[#151619] border border-[#292B30] rounded-xl shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-white">Temporary password</h2>
                <button onClick={() => setTempPassword(null)} className="text-gray-500 hover:text-white" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[13px] text-gray-400 mt-2">Share this securely with {name}. It is shown only once and is not stored anywhere in readable form.</p>
              <div className="mt-4 flex items-center gap-2 bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-3">
                <code className="flex-1 text-yellow-400 font-mono text-[15px] break-all" data-testid="temp-password">{tempPassword}</code>
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(tempPassword); toast.success('Copied'); } catch { toast.error('Copy failed'); }
                  }}
                  className="p-1.5 text-gray-400 hover:text-white" aria-label="Copy temporary password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setTempPassword(null)} className="mt-5 w-full py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold">Done</button>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Mirrors the server rules so the menu only offers what will succeed
  const allowed = (t: ActionTarget) => {
    const manageable = !t.isSelf && abilities.canEdit && (!t.privileged || abilities.isSuperAdmin);
    return {
      edit: abilities.canEdit && (!t.privileged || abilities.isSuperAdmin),
      permissions: manageable,
      reset: manageable,
      status: manageable,
      delete: !t.isSelf && abilities.canDelete && (!t.privileged || abilities.isSuperAdmin),
    };
  };

  return { open, dialog, allowed };
}

export function UserActionsMenu({ target, actions }: { target: ActionTarget; actions: ReturnType<typeof useUserActionDialogs> }) {
  const [menu, setMenu] = useState(false);
  const can = actions.allowed(target);
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-300 hover:bg-[#292B30] hover:text-white text-left';

  return (
    <div className="relative inline-block">
      <button onClick={() => setMenu(m => !m)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#292B30]" aria-label={`Actions for ${target.name ?? 'user'}`} aria-haspopup="menu" aria-expanded={menu}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
          <div role="menu" className="absolute right-0 mt-1 w-48 bg-[#1a1b1e] border border-[#292B30] rounded-lg shadow-xl py-1 z-50">
            <Link href={`/users/${target.id}`} className={item} role="menuitem"><Eye className="w-3.5 h-3.5" /> View</Link>
            {can.edit && <Link href={`/users/${target.id}/edit`} className={item} role="menuitem"><Pencil className="w-3.5 h-3.5" /> Edit</Link>}
            {can.permissions && <Link href={`/users/${target.id}/permissions`} className={item} role="menuitem"><Shield className="w-3.5 h-3.5" /> Permissions</Link>}
            {can.reset && <button className={item} role="menuitem" onClick={() => { setMenu(false); actions.open(target, { kind: 'reset' }); }}><KeyRound className="w-3.5 h-3.5" /> Reset Password</button>}
            {can.status && target.status === 'ACTIVE' && (
              <>
                <button className={item} role="menuitem" onClick={() => { setMenu(false); actions.open(target, { kind: 'status', status: 'INACTIVE' }); }}><UserX className="w-3.5 h-3.5" /> Deactivate</button>
                <button className={item} role="menuitem" onClick={() => { setMenu(false); actions.open(target, { kind: 'status', status: 'SUSPENDED' }); }}><Ban className="w-3.5 h-3.5" /> Suspend</button>
              </>
            )}
            {can.status && target.status !== 'ACTIVE' && (
              <button className={item} role="menuitem" onClick={() => { setMenu(false); actions.open(target, { kind: 'status', status: 'ACTIVE' }); }}><UserCheck className="w-3.5 h-3.5" /> Activate</button>
            )}
            {can.delete && (
              <button className={`${item} text-red-400 hover:text-red-300`} role="menuitem" onClick={() => { setMenu(false); actions.open(target, { kind: 'delete' }); }}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
    status === 'PENDING' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
    status === 'SUSPENDED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
    'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${style}`}>{status}</span>;
}
