import Link from 'next/link';
import { requirePageAccess } from '@/lib/auth';
import { listAuditLog } from '@/lib/users/queries';
import { PageShell } from '../UsersNav';

export const dynamic = 'force-dynamic';

const ACTIONS = ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'ACCOUNT_LOCKED', 'USER_CREATED', 'USER_UPDATED', 'ROLE_CHANGED', 'PERMISSIONS_CHANGED',
  'PASSWORD_RESET', 'PASSWORD_CHANGED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_SUSPENDED', 'USER_DELETED',
  'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'ROLE_PERMISSIONS_CHANGED', 'ACCESS_DENIED'];

function summary(v: unknown) {
  if (v === null || v === undefined) return '';
  const s = JSON.stringify(v);
  return s.length > 140 ? s.slice(0, 140) + '…' : s;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePageAccess(['users']);
  const sp = await searchParams;
  const action = ACTIONS.includes(sp.action ?? '') ? sp.action : undefined;
  const data = await listAuditLog({ action, page: Number(sp.page) || 1 });
  const href = (p: Record<string, string | undefined>) => `/users/audit?${new URLSearchParams(Object.entries({ action, ...p }).filter(([, v]) => v) as [string, string][]).toString()}`;

  return (
    <PageShell title="Audit Log" subtitle="Security-sensitive activity. Passwords are never recorded.">
      <div className="flex flex-wrap gap-2">
        <Link href="/users/audit" className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold ${!action ? 'border-yellow-400 text-yellow-400' : 'border-[#292B30] text-gray-400 hover:text-white'}`}>All</Link>
        {ACTIONS.map(a => (
          <Link key={a} href={href({ action: a, page: undefined })} className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold ${action === a ? 'border-yellow-400 text-yellow-400' : 'border-[#292B30] text-gray-400 hover:text-white'}`}>{a.replace(/_/g, ' ')}</Link>
        ))}
      </div>
      <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
        {data.entries.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-500">No audit entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400">
                <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">IP / Device</th></tr>
              </thead>
              <tbody className="divide-y divide-[#1e2025]">
                {data.entries.map(e => (
                  <tr key={e.id} className="align-top">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(e.createdAt).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${['FAILED_LOGIN', 'ACCESS_DENIED', 'ACCOUNT_LOCKED', 'USER_DELETED'].includes(e.action) ? 'text-red-400' : 'text-yellow-400'}`}>{e.action}</td>
                    <td className="px-4 py-3 text-gray-200">{e.actor}</td>
                    <td className="px-4 py-3 text-gray-200">{e.target}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px] max-w-md break-all">
                      {e.oldValue ? <div><span className="text-red-400/70">old</span> {summary(e.oldValue)}</div> : null}
                      {e.newValue ? <div><span className="text-green-400/70">new</span> {summary(e.newValue)}</div> : null}
                      {e.metadata ? <div>{summary(e.metadata)}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[11px] max-w-[220px] truncate" title={e.userAgent ?? ''}>{e.ip ?? '—'}<br />{e.userAgent ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data.pageCount > 1 && (
        <div className="flex justify-end gap-2 text-[12px] text-gray-400 items-center">
          <span>Page {data.page} of {data.pageCount}</span>
          {data.page > 1 && <Link href={href({ page: String(data.page - 1) })} className="px-3 py-1.5 rounded-lg border border-[#292B30] hover:bg-[#1a1b1e]">Previous</Link>}
          {data.page < data.pageCount && <Link href={href({ page: String(data.page + 1) })} className="px-3 py-1.5 rounded-lg border border-[#292B30] hover:bg-[#1a1b1e]">Next</Link>}
        </div>
      )}
    </PageShell>
  );
}
