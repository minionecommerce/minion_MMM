import { notFound, redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { getUserProfile } from '@/lib/users/queries';
import { permissionKey } from '@/lib/rbac/catalog';
import { PageShell } from '../../UsersNav';
import UserPermissionsEditor from './UserPermissionsEditor';

export const dynamic = 'force-dynamic';

export default async function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageAccess(['users'], 'edit');
  const { id } = await params;
  const profile = await getUserProfile(id);
  if (!profile) notFound();
  if (profile.id === ctx.userId || ((profile.isSuperAdmin || profile.isAdmin) && !ctx.isSuperAdmin)) redirect(`/users/${id}`);

  return (
    <PageShell title="Edit Permissions" subtitle={`${profile.name ?? profile.email} · Role: ${profile.roleName ?? 'none'}`}>
      <UserPermissionsEditor
        userId={profile.id}
        privileged={profile.isSuperAdmin || profile.isAdmin}
        roleKeys={profile.rolePermissions}
        initial={Object.fromEntries(profile.overrides.map(o => [permissionKey(o.module, o.action), o.effect]))}
        grantable={ctx.permissions}
      />
    </PageShell>
  );
}
