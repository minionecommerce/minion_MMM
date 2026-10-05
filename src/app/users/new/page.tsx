import { redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { listDepartments } from '@/lib/users/queries';
import { getUserLayout } from '@/lib/users/layout';
import { PageShell } from '../UsersNav';
import CreateUserWizard from './CreateUserWizard';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const ctx = await requirePageAccess(['users'], 'create');
  // Creating logins and credentials is a Super Admin feature
  if (!ctx.isSuperAdmin) redirect('/unauthorized');
  const [departments, layout] = await Promise.all([listDepartments(), getUserLayout()]);

  return (
    <PageShell title="Create User" subtitle="Give a person a login. Details → Access decides what they can do.">
      <CreateUserWizard layout={layout} departments={departments} />
    </PageShell>
  );
}
