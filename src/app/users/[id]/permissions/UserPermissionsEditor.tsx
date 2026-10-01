'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { PermissionMatrix, overridesToPayload, type OverrideMap } from '@/components/users/PermissionMatrix';
import { callApi } from '@/components/users/UserActions';
import { useToast } from '@/components/ui/Toast';

export default function UserPermissionsEditor({ userId, privileged, roleKeys, initial, grantable }: {
  userId: string;
  privileged: boolean;
  roleKeys: string[];
  initial: OverrideMap;
  grantable: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [overrides, setOverrides] = useState<OverrideMap>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await callApi(`/api/users/${userId}/permissions`, 'PUT', { overrides: overridesToPayload(overrides) });
      toast.success('Permissions saved. They apply on the user\'s next action.');
      router.push(`/users/${userId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#151619] border border-[#292B30] rounded-xl p-5 sm:p-6 space-y-5">
      {privileged && (
        <div className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-[13px] text-yellow-200">
          This user has every permission through their role or Full Administrator Access. User-specific changes have no effect until that is removed.
        </div>
      )}
      <PermissionMatrix mode="user" roleKeys={roleKeys} overrides={overrides} onChange={setOverrides} grantable={grantable} />
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" onClick={() => setOverrides({})} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e]">
          <RotateCcw className="w-4 h-4" /> Reset to role defaults
        </button>
        <div className="flex gap-3">
          <Link href={`/users/${userId}`} className="px-4 py-2.5 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e]">Cancel</Link>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
}
