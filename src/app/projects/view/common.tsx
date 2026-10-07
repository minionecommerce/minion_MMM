'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/leads/client';
import { displayValue } from '@/lib/records/values';
import type { LayoutField, LookupItem, ModuleLayoutDto, RecordRefs } from '@/lib/records/types';
import type { ProjectDetail, ProjectRow } from '@/lib/projects/types';
import type { TaskOptions } from '@/lib/tasks/types';
import FieldInput, { type FieldCtx } from '@/app/records/components/FieldInput';
import { toFormValue, toPayloadValue } from '@/app/records/client';

// ---------------------------------------------------------------------------
// What every section of the project page shares
// ---------------------------------------------------------------------------
export type ProjectCtx = {
  detail: ProjectDetail;
  layout: ModuleLayoutDto;
  canEdit: boolean;
  editing: boolean; // the Edit button of the page is on: Project Information shows inputs instead of text
  fieldCtx: FieldCtx; // for the inputs of the cells (the active users, the names of what is picked)
  // One request about the project: the answer is the project as it is now, which replaces what the page shows
  call: <T extends { detail: ProjectDetail }>(path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) => Promise<T>;
  // PUT { values } for one row (or the project itself): the message when it could not be saved, else null
  save: (path: string, values: Record<string, unknown>) => Promise<string | null>;
  fail: (e: unknown) => void; // tells the person what went wrong
  reload: () => Promise<void>; // reads the project again (something changed elsewhere: a task was added)
  taskOptions: TaskOptions | null; // the people a task can be given to (null: the person may not see tasks)
  userName: string;
};

export const ProjectContext = createContext<ProjectCtx | null>(null);
export function useProject(): ProjectCtx {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject needs a ProjectContext');
  return ctx;
}

export const errorText = (e: unknown, key?: string): string => {
  if (e instanceof ApiError && e.details?.length) {
    const own = key ? e.details.find(d => d.path === `values.${key}` || d.path.endsWith(`.${key}`)) : undefined;
    return (own ?? e.details[0]).message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
};

export const refsOf = (detail: ProjectDetail): RecordRefs => ({
  users: detail.refs.users,
  deals: detail.refs.deals,
  materialVendors: detail.refs.materialVendors,
  serviceVendors: detail.refs.serviceVendors,
  lookups: { ...detail.refs.lookups, template: detail.refs.templates },
});

// ---------------------------------------------------------------------------
// A section of the page: its title (the name from Edit Page Layout), its buttons, its anchor
// ---------------------------------------------------------------------------
export function Section({ id, title, actions, children, note }: { id: string; title: string; actions?: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <section id={`sec-${id}`} aria-labelledby={`sec-title-${id}`} className="mt-9 first:mt-0 scroll-mt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
        <h2 id={`sec-title-${id}`} className="text-[18px] font-bold text-[#1f2933] leading-tight">{title}</h2>
        {note && <span className="text-[12px] text-gray-500">{note}</span>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// The buttons of the page: yellow for the main action of a section (like the rest of the CRM), green for Add Material, blue for Add Row
export const buttonClass = 'inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-md border text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed';
export const primaryButton = `${buttonClass} border-[#f5b800] bg-[#f5b800] hover:bg-[#e6aa00] hover:border-[#e6aa00] text-black`;
export const lightButton = `${buttonClass} border-gray-300 bg-white hover:border-gray-500 text-gray-800`;
export const grayButton = `${buttonClass} border-[#e5e7eb] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-900`;
export const greenButton = `${buttonClass} border-[#3f7d20] bg-[#3f7d20] hover:bg-[#356b1b] text-white`;
export const blueButton = `${buttonClass} border-[#0d6efd] bg-[#0d6efd] hover:bg-[#0b5ed7] text-white`;

// ---------------------------------------------------------------------------
// Coloured badges: the Project Status of the page header and the Status of a Material Vendor row. The colour follows the option, so an option
// a Super Admin adds later simply shows in grey.
// ---------------------------------------------------------------------------
const TONES = {
  green: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  blue: 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
  red: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
  amber: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
  teal: 'bg-[#ccfbf1] text-[#115e59] border-[#99f6e4]',
  gray: 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]',
} as const;
type Tone = keyof typeof TONES;

const PROJECT_STATUS_TONE: Record<string, Tone> = { planning: 'blue', in_progress: 'green', on_hold: 'amber', completed: 'teal', cancelled: 'red' };
const MATERIAL_STATUS_TONE: Record<string, Tone> = { pending: 'red', ordered: 'green', in_transit: 'amber', received: 'blue', partially_received: 'amber', cancelled: 'gray' };

export const projectStatusTone = (id: string) => TONES[PROJECT_STATUS_TONE[id] ?? 'gray'];
export const materialStatusTone = (id: string) => TONES[MATERIAL_STATUS_TONE[id] ?? 'gray'];

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-semibold whitespace-nowrap ${tone}`}>{children}</span>;
}

// ---------------------------------------------------------------------------
// Columns from the layout: a section's enabled fields in the layout's order. `groups` puts fields in one cell (Planning to Take / Taken Date).
// ---------------------------------------------------------------------------
export type Col = { id: string; label: string; fields: LayoutField[] };

export function buildColumns(layout: ModuleLayoutDto, section: string, groups: string[][] = []): Col[] {
  const fields = layout.fields.filter(f => f.section === section && f.enabled);
  const out: Col[] = [];
  const used = new Set<string>();
  for (const f of fields) {
    if (used.has(f.key)) continue;
    const group = groups.find(g => g.includes(f.key));
    if (!group) { out.push({ id: f.key, label: f.label, fields: [f] }); continue; }
    const members = fields.filter(x => group.includes(x.key));
    members.forEach(m => used.add(m.key));
    out.push({ id: members[0].key, label: members.map(m => m.label).join(' / '), fields: members });
  }
  return out;
}

// What a table's inputs look like: quiet, like the text of a report, until the pointer is over them or they are being typed in
const QUIET_INPUTS = [
  '[&_input:not([type=checkbox]):not([type=file]):not(:hover):not(:focus)]:border-transparent',
  '[&_select:not(:hover):not(:focus)]:border-transparent',
  '[&_textarea:not(:hover):not(:focus)]:border-transparent',
  '[&_input:not([type=checkbox])]:h-[34px] [&_select]:h-[34px]',
  '[&_input:not([type=checkbox])]:px-2 [&_select]:px-1.5 [&_textarea]:px-2',
].join(' ');

const cellBorder = 'border-b border-r border-gray-200 last:border-r-0';

// The table of a section. The header, the borders and the empty message are the same everywhere; each section says what its cells show.
export function SectionTable({ columns, rows, cell, footer, empty, rowClass, extraHead, rowActions, groupHeader }: {
  columns: Col[];
  rows: ProjectRow[];
  cell: (field: LayoutField, row: ProjectRow, index: number) => ReactNode;
  footer?: ReactNode;
  empty?: string;
  rowClass?: (row: ProjectRow) => string;
  extraHead?: ReactNode; // the header cell of a last column that only holds buttons (rowActions)
  rowActions?: (row: ProjectRow, index: number) => ReactNode;
  groupHeader?: (row: ProjectRow, index: number, rows: ProjectRow[]) => ReactNode; // a line above a row that starts a group (QUOTE 1, QUOTE 2 ...), or null
}) {
  const span = columns.length + (extraHead ? 1 : 0);
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 bg-white ${QUIET_INPUTS}`}>
      <table className="min-w-full border-separate border-spacing-0 text-[13px] text-[#1f2933]">
        <thead>
          <tr>
            {columns.map(c => <th key={c.id} scope="col" className={`${cellBorder} bg-[#f3f4f6] px-3 py-2.5 text-center font-semibold text-[#374151] align-middle whitespace-nowrap`}>{c.label}</th>)}
            {extraHead}
          </tr>
        </thead>
        <tbody className={footer ? '' : '[&>tr:last-child>td]:border-b-0'}>
          {rows.length === 0 && <tr><td colSpan={span} className="px-3 py-7 text-center text-gray-500">{empty ?? 'Nothing here yet'}</td></tr>}
          {rows.map((row, i) => {
            const head = groupHeader?.(row, i, rows);
            return [
              head ? <tr key={`${row.id}-group`}><td colSpan={span} className="border-b border-gray-200 bg-[#f9fafb] px-3 py-2 font-bold text-[#1f2933]">{head}</td></tr> : null,
              <tr key={row.id} className={`align-top ${rowClass?.(row) ?? ''}`}>
                {columns.map(c => (
                  <td key={c.id} className={`${cellBorder} px-2 py-1.5 align-middle`}>
                    {c.fields.length === 1
                      ? cell(c.fields[0], row, i)
                      : <div className="space-y-1.5">{c.fields.map(f => <label key={f.key} className="block"><span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500">{f.label}</span>{cell(f, row, i)}</label>)}</div>}
                  </td>
                ))}
                {rowActions && <td className={`${cellBorder} px-2 py-1.5 align-middle text-center`}>{rowActions(row, i)}</td>}
              </tr>,
            ];
          })}
        </tbody>
        {footer}
      </table>
    </div>
  );
}

// A wide table shown as two tables one under the other, as in the reference: the first holds the columns up to the one the second starts with, the
// second repeats the number column and holds the rest (the money and the buttons). Columns a Super Admin adds go where the layout puts them.
export function SplitTables({ columns, secondFrom, numberKey, rows, cell, empty, rowClass }: {
  columns: Col[];
  secondFrom: string[]; // the keys of the fields that start the second table
  numberKey: string; // the key of the "No" column, repeated in the second table
  rows: ProjectRow[];
  cell: (field: LayoutField, row: ProjectRow, index: number) => ReactNode;
  empty: string;
  rowClass?: (row: ProjectRow) => string;
}) {
  const at = columns.findIndex(c => c.fields.some(f => secondFrom.includes(f.key)));
  if (at <= 0 || rows.length === 0) return <SectionTable columns={columns} rows={rows} cell={cell} empty={empty} rowClass={rowClass} />;
  const tail = columns.slice(at);
  const number = columns.find(c => c.fields.some(f => f.key === numberKey));
  const second = number && !tail.includes(number) ? [number, ...tail] : tail;
  return (
    <div className="space-y-3">
      <SectionTable columns={columns.slice(0, at)} rows={rows} cell={cell} empty={empty} rowClass={rowClass} />
      <SectionTable columns={second} rows={rows} cell={cell} rowClass={rowClass} />
    </div>
  );
}

// The totals under the columns they belong to (Quote Value, Exclusions and Total Quote Value; Item Value, Amount Spent and Profit Earned ...).
// The label sits in the cells before the first total; when every column of a total is hidden, the last total is shown with the label alone.
export function TotalsFooter({ columns, label, totals }: { columns: Col[]; label: string; totals: Record<string, ReactNode> }) {
  const totalOf = (c: Col) => { const f = c.fields.find(x => x.key in totals); return f ? totals[f.key] : undefined; };
  const first = columns.findIndex(c => totalOf(c) !== undefined);
  const cell = 'border-gray-200 bg-[#f9fafb] px-3 py-2 font-bold text-[#1f2933]';
  if (first < 0) {
    const last = Object.values(totals).at(-1);
    return <tfoot><tr><td colSpan={columns.length} className={`${cell} text-right`}>{label} <span className="ml-2">{last}</span></td></tr></tfoot>;
  }
  return (
    <tfoot>
      <tr>
        {first > 0 && <td colSpan={first} className={`${cell} text-right`}>{label}</td>}
        {columns.slice(first).map((c, i) => {
          const total = totalOf(c);
          return <td key={c.id} className={`${cell} text-right ${i > 0 ? 'border-l' : ''}`}>{first === 0 && i === 0 ? <span><span className="mr-2 font-semibold text-gray-600">{label}</span>{total}</span> : total}</td>;
        })}
      </tr>
    </tfoot>
  );
}

// One total under the column it belongs to
export function TotalFooter({ columns, totalKey, label, value }: { columns: Col[]; totalKey: string; label: string; value: ReactNode }) {
  return <TotalsFooter columns={columns} label={label} totals={{ [totalKey]: value }} />;
}

// ---------------------------------------------------------------------------
// One input of a row or of the page header, saved as soon as it is left (text, numbers) or changed (choices, dates, files, ticks).
// The server's answer replaces the page, so what is shown is always what was kept; a refusal is written under the input.
// ---------------------------------------------------------------------------
const INSTANT = new Set(['DROPDOWN', 'MULTISELECT', 'CHECKBOX', 'DATE', 'DATETIME', 'USER', 'LOOKUP', 'FILE']); // a Multi-select hands over its choices once, when its list closes

export function CellField({ field, value, htmlId, onSave, compact = true, badge }: {
  field: LayoutField;
  value: unknown;
  htmlId: string;
  onSave: (payload: unknown) => Promise<string | null>; // the message when it could not be saved
  compact?: boolean;
  badge?: (optionId: string) => string; // a Dropdown shown as a coloured badge: the classes of the chosen option
}) {
  const { fieldCtx } = useProject();
  const payloadOf = (v: unknown) => JSON.stringify(toPayloadValue(field, toFormValue(field, v)));
  const stored = JSON.stringify(value ?? null);
  const [seen, setSeen] = useState(stored);
  const [draft, setDraft] = useState<unknown>(() => toFormValue(field, value));
  const [saved, setSaved] = useState(() => payloadOf(value)); // what the server holds, as it would be sent
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // What the server holds now (after a save, a reload or somebody else's change) is what the input shows
  if (seen !== stored) {
    setSeen(stored);
    setDraft(toFormValue(field, value));
    setSaved(payloadOf(value));
    setError('');
  }

  const commit = async (next: unknown) => {
    const payload = toPayloadValue(field, next);
    const key = JSON.stringify(payload);
    if (key === saved) return;
    setBusy(true);
    setError('');
    const message = await onSave(payload);
    setBusy(false);
    if (message) setError(message);
    else setSaved(key);
  };

  const instant = INSTANT.has(field.type);
  return (
    <div
      className="relative min-w-[110px]"
      onBlur={e => { if (!instant && !e.currentTarget.contains(e.relatedTarget as Node | null)) void commit(draft); }}
      onKeyDown={e => { if (e.key === 'Enter' && field.type !== 'TEXTAREA' && !instant) (e.target as HTMLElement).blur(); }}
    >
      <FieldInput
        field={{ ...field, required: false }}
        value={draft}
        onChange={v => { setDraft(v); if (instant) void commit(v); }}
        error={error || undefined}
        ctx={fieldCtx}
        compact={compact}
        bare={compact}
        badge={badge}
        htmlId={htmlId}
      />
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-1.5 top-2.5 pointer-events-none" aria-label="Saving" />}
      {error && <p id={`${htmlId}-error`} role="alert" className="mt-0.5 text-[11px] leading-tight text-[#d9232b]">{error}</p>}
    </div>
  );
}

// What a field shows when the person may not edit it
export function ReadValue({ field, value }: { field: LayoutField; value: unknown }) {
  const { detail } = useProject();
  const text = displayValue(field, value, refsOf(detail));
  if (field.type === 'URL' && text) return <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[#1a56c4] hover:underline break-all">{text}</a>;
  return text ? <span className="whitespace-pre-wrap break-words">{text}</span> : <span className="text-gray-300">—</span>;
}

// A field of a row: an input for a person who may edit, the plain value for one who may not
export function RowField({ field, row, path, badge }: { field: LayoutField; row: ProjectRow; path: string; badge?: (optionId: string) => string }) {
  const { canEdit, save } = useProject();
  const value = row.values[field.key];
  if (!canEdit || field.readOnly) {
    const chosen = badge && field.type === 'DROPDOWN' ? field.options.find(o => o.id === value) : undefined;
    return chosen ? <Badge tone={badge!(chosen.id)}>{chosen.label}</Badge> : <ReadValue field={field} value={value} />;
  }
  return <CellField field={field} value={value} htmlId={`${row.id}-${field.key}`} badge={badge} onSave={payload => save(path, { [field.key]: payload })} />;
}

export const rupees = (n: unknown): string => (typeof n === 'number' ? '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n) : '—');
export const moneyCell = (n: unknown, tone?: string) => (typeof n === 'number' ? <span className={`font-medium ${tone ?? ''}`}>{rupees(n)}</span> : <span className="text-gray-300">—</span>);

// The active users the inputs of the page offer
export type UserItem = LookupItem;
