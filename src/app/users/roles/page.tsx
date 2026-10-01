import { can, requirePageAccess } from '@/lib/auth';
import { listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../UsersNav';
import RolesList from './RolesList';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const ctx = await requirePageAccess(['users']);
  const roles = await listRolesWithPermissions();
  return (
    <PageShell title="Roles" subtitle="Roles are reusable permission sets. Users get their role's permissions plus any user-specific changes.">
      <RolesList roles={roles} canEdit={can(ctx, 'users', 'edit')} />
    </PageShell>
  );
}
