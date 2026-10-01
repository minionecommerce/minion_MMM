import { requirePageAccess } from '@/lib/auth';
import { listDepartments, listEmployeesWithoutLogin, listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../UsersNav';
import CreateUserWizard from './CreateUserWizard';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const ctx = await requirePageAccess(['users'], 'create');
  const [roles, departments, employees] = await Promise.all([listRolesWithPermissions(), listDepartments(), listEmployeesWithoutLogin()]);

  return (
    <PageShell title="Create User" subtitle="Give an employee a login account, role and permissions.">
      <CreateUserWizard
        roles={roles.filter(r => r.isActive && (ctx.isSuperAdmin || !r.isSuperAdmin))}
        departments={departments}
        employees={employees}
        actor={{ isSuperAdmin: ctx.isSuperAdmin, permissions: ctx.permissions, canEditPermissions: ctx.permissions.includes('*') || ctx.permissions.includes('users.edit') }}
      />
    </PageShell>
  );
}
