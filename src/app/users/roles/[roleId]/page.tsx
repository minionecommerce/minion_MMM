import { notFound } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../../UsersNav';
import RoleEditor from './RoleEditor';

export const dynamic = 'force-dynamic';

export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  const ctx = await requirePageAccess(['users']);
  const { roleId } = await params;
  const role = (await listRolesWithPermissions()).find(r => r.id === roleId);
  if (!role) notFound();

  // Same rule as the server: roles and their permissions are changed by Super Admins only
  const editable = ctx.isSuperAdmin;

  return (
    <PageShell title={role.name} subtitle={role.description ?? undefined}>
      <RoleEditor role={role} editable={editable} grantable={ctx.permissions} />
    </PageShell>
  );
}
