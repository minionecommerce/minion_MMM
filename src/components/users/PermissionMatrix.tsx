'use client';

import { Check, Minus, Plus, X } from 'lucide-react';
import { ACTIONS, ACTION_LABELS, MODULES, permissionKey, snapshotAllows, type Action } from '@/lib/rbac/catalog';

export type Effect = 'ALLOW' | 'DENY';
export type OverrideMap = Record<string, Effect>;

type CellState = 'none' | 'role' | 'added' | 'removed' | 'granted';

type Props =
  | { mode: 'role'; selected: string[]; onChange: (keys: string[]) => void; grantable?: string[]; disabled?: boolean }
  | { mode: 'user'; roleKeys: string[]; overrides: OverrideMap; onChange: (o: OverrideMap) => void; grantable?: string[]; disabled?: boolean }
  | { mode: 'readonly'; effective: string[] };

const GROUPS = Array.from(new Set(MODULES.map(m => m.group)));

function canGrant(grantable: string[] | undefined, key: string) {
  if (!grantable) return true;
  const [m, a] = key.split('.');
  return snapshotAllows(grantable, m, a);
}

export function PermissionMatrix(props: Props) {
  const cellState = (key: string): CellState => {
    if (props.mode === 'readonly') return props.effective.includes(key) || props.effective.includes('*') ? 'granted' : 'none';
    if (props.mode === 'role') return props.selected.includes(key) ? 'granted' : 'none';
    const inRole = props.roleKeys.includes(key);
    const o = props.overrides[key];
    if (inRole) return o === 'DENY' ? 'removed' : 'role';
    return o === 'ALLOW' ? 'added' : 'none';
  };

  const editable = props.mode !== 'readonly' && !props.disabled;

  const toggle = (key: string) => {
    if (!editable) return;
    if (props.mode === 'role') {
      const on = props.selected.includes(key);
      if (!on && !canGrant(props.grantable, key)) return;
      props.onChange(on ? props.selected.filter(k => k !== key) : [...props.selected, key]);
    } else if (props.mode === 'user') {
      const next = { ...props.overrides };
      const inRole = props.roleKeys.includes(key);
      if (inRole) {
        if (next[key] === 'DENY') delete next[key];
        else next[key] = 'DENY';
      } else {
        if (next[key] === 'ALLOW') delete next[key];
        else {
          if (!canGrant(props.grantable, key)) return;
          next[key] = 'ALLOW';
        }
      }
      props.onChange(next);
    }
  };

  // Clicking a module name turns the whole row on, or off when it is fully on
  const toggleRow = (module: string) => {
    if (!editable) return;
    const keys = ACTIONS.map(a => permissionKey(module, a));
    const isOn = (k: string) => ['granted', 'role', 'added'].includes(cellState(k));
    const allOn = keys.every(isOn);
    if (props.mode === 'role') {
      const rest = props.selected.filter(k => !keys.includes(k));
      props.onChange(allOn ? rest : [...rest, ...keys.filter(k => canGrant(props.grantable, k))]);
    } else if (props.mode === 'user') {
      const next = { ...props.overrides };
      for (const k of keys) {
        const inRole = props.roleKeys.includes(k);
        if (allOn) {
          if (inRole) next[k] = 'DENY';
          else delete next[k];
        } else {
          if (inRole) delete next[k];
          else if (canGrant(props.grantable, k)) next[k] = 'ALLOW';
        }
      }
      props.onChange(next);
    }
  };

  return (
    <div className="space-y-4">
      {props.mode === 'user' && (
        <div className="flex flex-wrap gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center"><Check className="w-3 h-3 text-yellow-400" /></span>From role</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-500/15 border border-green-500/40 flex items-center justify-center"><Plus className="w-3 h-3 text-green-400" /></span>Added for this user</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-red-500/15 border border-red-500/40 flex items-center justify-center"><X className="w-3 h-3 text-red-400" /></span>Removed for this user</span>
          <span className="text-gray-500">Granting any action also grants View.</span>
        </div>
      )}
      <div className="overflow-x-auto border border-[#292B30] rounded-xl">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-[#111113] text-gray-400">
            <tr>
              <th className="px-4 py-3 font-semibold min-w-[160px]">Module</th>
              {ACTIONS.map(a => (
                <th key={a} className="px-2 py-3 font-semibold text-center min-w-[72px]">{ACTION_LABELS[a as Action]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map(group => (
              <GroupRows key={group} group={group} cellState={cellState} toggle={toggle} toggleRow={toggleRow} editable={editable}
                grantable={props.mode === 'readonly' ? undefined : props.grantable} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({ group, cellState, toggle, toggleRow, editable, grantable }: {
  group: string;
  cellState: (k: string) => CellState;
  toggle: (k: string) => void;
  toggleRow: (m: string) => void;
  editable: boolean;
  grantable?: string[];
}) {
  const modules = MODULES.filter(m => m.group === group);
  return (
    <>
      <tr className="bg-[#0D0D0F]">
        <td colSpan={ACTIONS.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-yellow-400/80 border-t border-[#292B30]">{group}</td>
      </tr>
      {modules.map(m => (
        <tr key={m.key} className="border-t border-[#1e2025] hover:bg-[#1a1b1e]/60">
          <td className="px-4 py-2">
            {editable ? (
              <button type="button" onClick={() => toggleRow(m.key)} className="font-semibold text-gray-200 hover:text-yellow-400" title="Toggle all actions">
                {m.label}
              </button>
            ) : (
              <span className="font-semibold text-gray-200">{m.label}</span>
            )}
          </td>
          {ACTIONS.map(a => {
            const key = permissionKey(m.key, a);
            const state = cellState(key);
            const blocked = editable && (state === 'none') && !canGrant(grantable, key);
            return (
              <td key={a} className="px-2 py-2 text-center">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  disabled={!editable || blocked}
                  aria-label={`${m.label} ${ACTION_LABELS[a as Action]}: ${state}`}
                  title={blocked ? 'You cannot grant a permission you do not have' : undefined}
                  className={`w-7 h-7 rounded-md border inline-flex items-center justify-center transition-colors ${
                    state === 'granted' ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400' :
                    state === 'role' ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400' :
                    state === 'added' ? 'bg-green-500/15 border-green-500/40 text-green-400' :
                    state === 'removed' ? 'bg-red-500/15 border-red-500/40 text-red-400' :
                    blocked ? 'border-[#1e2025] text-gray-700 cursor-not-allowed' :
                    'border-[#292B30] text-gray-600'
                  } ${editable && !blocked ? 'hover:border-yellow-400/60' : ''}`}
                >
                  {state === 'granted' || state === 'role' ? <Check className="w-3.5 h-3.5" /> :
                   state === 'added' ? <Plus className="w-3.5 h-3.5" /> :
                   state === 'removed' ? <X className="w-3.5 h-3.5" /> :
                   <Minus className="w-3 h-3 opacity-40" />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

// Convert an override map to the API payload
export function overridesToPayload(o: OverrideMap) {
  return Object.entries(o).map(([key, effect]) => {
    const [module, action] = key.split('.');
    return { module, action, effect };
  });
}
