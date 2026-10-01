'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Wand2, Check, X } from 'lucide-react';
import { PASSWORD_RULES, generateStrongPassword } from '@/lib/password-policy';
import { useToast } from '@/components/ui/Toast';

const inputClass = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none';

export function PasswordInput({
  value,
  onChange,
  confirm,
  onConfirmChange,
  showGenerator = true,
  label = 'Password',
  autoComplete = 'new-password',
}: {
  value: string;
  onChange: (v: string) => void;
  confirm?: string;
  onConfirmChange?: (v: string) => void;
  showGenerator?: boolean;
  label?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const toast = useToast();

  const generate = () => {
    const p = generateStrongPassword();
    onChange(p);
    onConfirmChange?.(p);
    setVisible(true);
  };

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Password copied to clipboard');
    } catch {
      toast.error('Could not copy. Select the password and copy it manually.');
    }
  };

  const mismatch = confirm !== undefined && confirm.length > 0 && confirm !== value;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[12px] font-semibold text-gray-400">{label}</label>
          {showGenerator && (
            <button type="button" onClick={generate} className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 hover:text-yellow-300">
              <Wand2 className="w-3.5 h-3.5" /> Generate Strong Password
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            autoComplete={autoComplete}
            className={`${inputClass} pr-20 font-mono`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button type="button" onClick={() => setVisible(v => !v)} className="p-1.5 text-gray-500 hover:text-white" aria-label={visible ? 'Hide password' : 'Show password'}>
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button type="button" onClick={copy} className="p-1.5 text-gray-500 hover:text-white" aria-label="Copy password">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {onConfirmChange && (
        <div>
          <label className="block text-[12px] font-semibold text-gray-400 mb-1.5">Confirm {label}</label>
          <input
            type={visible ? 'text' : 'password'}
            value={confirm}
            onChange={e => onConfirmChange(e.target.value)}
            autoComplete={autoComplete}
            className={`${inputClass} font-mono ${mismatch ? 'border-red-500/60' : ''}`}
          />
          {mismatch && <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>}
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {PASSWORD_RULES.map(r => {
          const ok = r.test(value);
          return (
            <li key={r.id} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-green-400' : 'text-gray-500'}`}>
              {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
