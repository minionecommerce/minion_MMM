import { notFound } from 'next/navigation';
import { can, requirePageAccess } from '@/lib/auth';
import { listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../../UsersNav';
import RoleEditor from './RoleEditor';

export const dynamic = 'force-dynamic';

export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  const ctx = await requirePageAccess(['users']);
  const { roleId } = await params;
  const role = (await listRolesWithPermissions()).find(r => r.id === roleId);
  if (!role) notFound();

  // Same rules as the server: no editing the Super Admin role unless Super Admin, never your own role
  const editable = can(ctx, 'users', 'edit') && (ctx.isSuperAdmin || (!role.isSuperAdmin && ctx.roleId !== role.id));

  return (
    <PageShell title={role.name} subtitle={role.description ?? undefined}>
      <RoleEditor role={role} editable={editable} grantable={ctx.permissions} ownRole={ctx.roleId === role.id} />
    </PageShell>
  );
}
