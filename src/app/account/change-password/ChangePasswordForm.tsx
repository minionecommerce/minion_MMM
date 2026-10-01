'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { KeyRound, Loader2 } from 'lucide-react';
import { PasswordInput } from '@/components/users/PasswordInput';
import { callApi } from '@/components/users/UserActions';
import { isStrongPassword } from '@/lib/password-policy';

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isStrongPassword(next)) return setError('New password does not meet all requirements.');
    if (next !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await callApi('/api/account/password', 'POST', { currentPassword: current, newPassword: next });
      // Every session (including this one) was ended on the server
      await signOut({ redirect: false });
      window.location.href = '/login?passwordChanged=1';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#151619] border border-[#292B30] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center"><KeyRound className="w-5 h-5 text-yellow-400" /></div>
          <div>
            <h1 className="text-[18px] font-bold">Change Password</h1>
            <p className="text-[12px] text-gray-400">{forced ? 'Your administrator requires you to set a new password before continuing.' : 'You will be signed out of all devices afterwards.'}</p>
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-gray-400 mb-1.5">{forced ? 'Temporary password' : 'Current password'}</label>
          <input type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)}
            className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
        </div>
        <PasswordInput label="New password" value={next} onChange={setNext} confirm={confirm} onConfirmChange={setConfirm} />
        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[13px] text-red-300" role="alert">{error}</div>}
        <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Change Password
        </button>
        {forced && (
          <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className="w-full text-[12px] text-gray-500 hover:text-white">Sign out instead</button>
        )}
      </form>
    </div>
  );
}
