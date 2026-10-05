'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Users as UsersIcon, Loader2, Crown, ShieldCheck } from 'lucide-react';
import { StatusBadge, UserActionsMenu, useUserActionDialogs } from '@/components/users/UserActions';
import type { UserListParams, listUsers } from '@/lib/users/queries';
import { COLUMN_FIELD, USER_COLUMNS, accessLabel, type UserColumnId, type UserLayout } from '@/lib/users/layout-shared';

type Data = Awaited<ReturnType<typeof listUsers>>;
type Row = Data['users'][number];

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never');

type SortCol = NonNullable<UserListParams['sort']>;

function SortHeader({ col, label, params, onSort }: { col: SortCol; label: string; params: UserListParams; onSort: (c: SortCol) => void }) {
  return (
    <button onClick={() => onSort(col)} className={`flex items-center gap-1 font-semibold hover:text-white ${params.sort === col ? 'text-yellow-400' : ''}`}>
      {label} <ArrowUpDown className="w-3 h-3" />
    </button>
  );
}

export default function UsersClient({ data, params, currentUserId, abilities, layout }: {
  layout: UserLayout; // column order and field labels from Users → Edit Page Layout
  data: Data;
  params: UserListParams;
  currentUserId: string;
  abilities: { canEdit: boolean; canDelete: boolean; isSuperAdmin: boolean };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? '');
  const actions = useUserActionDialogs(abilities);

  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in updates)) next.delete('page');
    startTransition(() => router.push(`/users?${next.toString()}`));
  };

  // Debounced search
  useEffect(() => {
    if ((params.q ?? '') === q) return;
    const t = setTimeout(() => setParam({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sortBy = (col: SortCol) => {
    const dir = params.sort === col && params.dir === 'asc' ? 'desc' : 'asc';
    setParam({ sort: col, dir });
  };


  // The header of a column that shows a form field follows that field's label
  const colLabel = (id: UserColumnId) => {
    const key = COLUMN_FIELD[id];
    return (key && layout.fields.find(f => f.key === key)?.label) || USER_COLUMNS.find(c => c.id === id)!.label;
  };

  const header = (id: UserColumnId) => {
    switch (id) {
      case 'user': return <th key={id} className="px-3 py-3"><SortHeader col="name" label={colLabel(id)} params={params} onSort={sortBy} /></th>;
      case 'email': return <th key={id} className="px-3 py-3"><SortHeader col="email" label={colLabel(id)} params={params} onSort={sortBy} /></th>;
      case 'status': return <th key={id} className="px-3 py-3"><SortHeader col="status" label={colLabel(id)} params={params} onSort={sortBy} /></th>;
      case 'lastLogin': return <th key={id} className="px-3 py-3"><SortHeader col="lastLoginAt" label={colLabel(id)} params={params} onSort={sortBy} /></th>;
      case 'created': return <th key={id} className="px-3 py-3"><SortHeader col="createdAt" label={colLabel(id)} params={params} onSort={sortBy} /></th>;
      case 'department': return <th key={id} className="px-3 py-3 font-semibold hidden 2xl:table-cell">{colLabel(id)}</th>;
      default: return <th key={id} className="px-3 py-3 font-semibold">{colLabel(id)}</th>;
    }
  };

  const cell = (id: UserColumnId, u: Row) => {
    switch (id) {
      case 'user': return (
        <td key={id} className="px-3 py-3">
          <Link href={`/users/${u.id}`} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-[#3B2E15] flex items-center justify-center shrink-0 text-[12px] font-bold text-yellow-400">
              {(u.name || u.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white group-hover:text-yellow-400 truncate flex items-center gap-1.5">
                {u.name || '—'}
                {u.id === currentUserId && <span className="text-[10px] text-gray-500 font-medium">(you)</span>}
              </div>
              <div className="text-[11px] text-gray-500 truncate">{u.designation || ''}<span className="2xl:hidden">{u.designation && u.department ? ' · ' : ''}{u.department || ''}</span></div>
            </div>
          </Link>
        </td>
      );
      case 'employeeCode': return <td key={id} className="px-3 py-3 text-gray-400 font-mono text-[12px]">{u.employeeCode || '—'}</td>;
      case 'email': return <td key={id} className="px-3 py-3 text-gray-300">{u.email}</td>;
      case 'role': return (
        <td key={id} className="px-3 py-3">
          <span className="inline-flex items-center gap-1.5 text-gray-200">
            {u.isSuperAdmin && <Crown className="w-3.5 h-3.5 text-yellow-400" aria-label="Super Admin" />}
            {accessLabel(layout, u)}
          </span>
        </td>
      );
      case 'department': return <td key={id} className="px-3 py-3 text-gray-400 hidden 2xl:table-cell">{u.department || '—'}</td>;
      case 'status': return <td key={id} className="px-3 py-3"><StatusBadge status={u.status} /></td>;
      case 'lastLogin': return <td key={id} className="px-3 py-3 text-gray-400 whitespace-nowrap">{fmtDateTime(u.lastLoginAt)}</td>;
      case 'created': return <td key={id} className="px-3 py-3 text-gray-400 whitespace-nowrap">{fmtDate(u.createdAt)}</td>;
      case 'permissions': return (
        <td key={id} className="px-3 py-3 text-[12px] whitespace-nowrap">
          {u.isSuperAdmin ? <span className="text-yellow-400 font-semibold">All (Super Admin)</span> :
           u.isAdmin ? <span className="text-yellow-400 font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Full Administrator</span> :
           <span className="text-gray-400">By access level{u.overrideCount ? <span className="text-green-400"> + {u.overrideCount} custom</span> : ''}</span>}
        </td>
      );
    }
  };

  const selectClass = 'bg-[#151619] border border-[#292B30] rounded-lg px-3 py-2.5 text-[13px] text-gray-200 focus:border-yellow-500 focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, email or employee ID…"
            aria-label="Search users"
            className="w-full bg-[#151619] border border-[#292B30] rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
          />
        </div>
        <select aria-label={`Filter by ${colLabel('role').toLowerCase()}`} value={params.access ?? ''} onChange={e => setParam({ access: e.target.value || undefined })} className={selectClass}>
          <option value="">All {colLabel('role').toLowerCase()}</option>
          {(layout.fields.find(x => x.key === 'access')?.options ?? []).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select aria-label="Filter by status" value={params.status ?? ''} onChange={e => setParam({ status: e.target.value || undefined })} className={selectClass}>
          <option value="">All statuses</option>
          {['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between text-[12px] text-gray-500">
        <span>{data.total} user{data.total === 1 ? '' : 's'}</span>
        {isPending && <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</span>}
      </div>

      {/* Table */}
      <div className={`bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {data.users.length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon className="w-8 h-8 mx-auto text-gray-600 mb-3" />
            <div className="text-[14px] font-semibold text-gray-400">No users found</div>
            <div className="text-[12px] text-gray-500 mt-1">Try a different search or clear the filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400 text-[12px]">
                <tr>
                  {layout.columns.map(header)}
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2025]">
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-[#1a1b1e]">
                    {layout.columns.map(id => cell(id, u))}
                    <td className="px-3 py-3 text-right">
                      <UserActionsMenu
                        actions={actions}
                        target={{ id: u.id, name: u.name, status: u.status, isSelf: u.id === currentUserId, privileged: u.isSuperAdmin || u.isAdmin }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-[12px] text-gray-400">
          <span>Page {data.page} of {data.pageCount}</span>
          <button disabled={data.page <= 1} onClick={() => setParam({ page: String(data.page - 1) })} className="p-2 rounded-lg border border-[#292B30] disabled:opacity-40 hover:bg-[#1a1b1e]" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
          <button disabled={data.page >= data.pageCount} onClick={() => setParam({ page: String(data.page + 1) })} className="p-2 rounded-lg border border-[#292B30] disabled:opacity-40 hover:bg-[#1a1b1e]" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {actions.dialog}
    </div>
  );
}
