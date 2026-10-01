import Link from 'next/link';
import { Plus } from 'lucide-react';
import { can, requirePageAccess } from '@/lib/auth';
import { listUsers, listRolesWithPermissions, type UserListParams } from '@/lib/users/queries';
import { USER_STATUSES } from '@/lib/users/service';
import { PageShell } from './UsersNav';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

const SORTS = ['name', 'email', 'createdAt', 'lastLoginAt', 'status'] as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(['users']);
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);

  const params: UserListParams = {
    q: str('q')?.slice(0, 100),
    roleId: str('role'),
    status: USER_STATUSES.includes(str('status') as never) ? str('status') : undefined,
    sort: SORTS.includes(str('sort') as never) ? (str('sort') as UserListParams['sort']) : 'createdAt',
    dir: str('dir') === 'asc' ? 'asc' : 'desc',
    page: Number(str('page')) || 1,
  };

  const [data, roles] = await Promise.all([listUsers(params), listRolesWithPermissions()]);

  return (
    <PageShell
      title="Users"
      subtitle="Login accounts, roles and access for everyone who uses the CRM."
      actions={can(ctx, 'users', 'create') ? (
        <Link href="/users/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold shadow-[0_0_15px_rgba(255,196,0,0.2)]">
          <Plus className="w-4 h-4" /> Create User
        </Link>
      ) : null}
    >
      <UsersClient
        data={data}
        params={params}
        roles={roles.map(r => ({ id: r.id, name: r.name }))}
        currentUserId={ctx.userId}
        abilities={{ canEdit: can(ctx, 'users', 'edit'), canDelete: can(ctx, 'users', 'delete'), isSuperAdmin: ctx.isSuperAdmin }}
      />
    </PageShell>
  );
}
