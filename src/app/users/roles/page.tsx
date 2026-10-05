import { requirePageAccess } from '@/lib/auth';
import { listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../UsersNav';
import RolesList from './RolesList';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const ctx = await requirePageAccess(['users']);
  const roles = await listRolesWithPermissions();
  return (
    <PageShell title="Roles" subtitle="Roles are reusable permission sets. Each Access level (Users → Edit Page Layout → Access) gives one role; people get its permissions plus any user-specific changes.">
      <RolesList roles={roles} canEdit={ctx.isSuperAdmin} />
    </PageShell>
  );
}
