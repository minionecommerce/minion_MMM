'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Lock, Plus, Shield, Loader2 } from 'lucide-react';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';
import type { RoleSummary } from '@/lib/users/queries';

export default function RolesList({ roles, canEdit }: { roles: RoleSummary[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await callApi('/api/roles', 'POST', { name, description: description || null });
      toast.success(`Role "${name}" created. Now choose its permissions.`);
      router.push(`/users/roles/${data.role.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold"><Plus className="w-4 h-4" /> Create Role</button>
        </div>
      )}
      {open && (
        <form onSubmit={create} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <div><label className="block text-[12px] font-semibold text-gray-400 mb-1.5">Role name</label><input required minLength={2} value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" /></div>
          <div><label className="block text-[12px] font-semibold text-gray-400 mb-1.5">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" /></div>
          <button disabled={busy} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Create</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map(r => (
          <Link key={r.id} href={`/users/roles/${r.id}`} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-yellow-400/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#292B30] flex items-center justify-center">{r.isSuperAdmin ? <Crown className="w-4 h-4 text-yellow-400" /> : <Shield className="w-4 h-4 text-yellow-500" />}</div>
                <div>
                  <div className="text-[15px] font-bold flex items-center gap-1.5">{r.name}{r.isSystem && <Lock className="w-3 h-3 text-gray-500" aria-label="System role" />}</div>
                  <div className="text-[11px] text-gray-500">{r.userCount} user{r.userCount === 1 ? '' : 's'}</div>
                </div>
              </div>
              {!r.isActive && <span className="px-2 py-0.5 rounded-full border border-gray-500/30 text-gray-400 text-[10px] font-bold">INACTIVE</span>}
            </div>
            <p className="text-[12px] text-gray-400 mt-3 line-clamp-2">{r.description || 'No description'}</p>
            <div className="text-[12px] mt-3 text-yellow-400/80 font-semibold">{r.isSuperAdmin ? 'Every permission' : `${r.permissions.length} permissions`}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
