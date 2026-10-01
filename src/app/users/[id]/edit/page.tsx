import { notFound, redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { getUserProfile, listDepartments, listRolesWithPermissions } from '@/lib/users/queries';
import { PageShell } from '../../UsersNav';
import EditUserForm from './EditUserForm';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageAccess(['users'], 'edit');
  const { id } = await params;
  const [profile, roles, departments] = await Promise.all([getUserProfile(id), listRolesWithPermissions(), listDepartments()]);
  if (!profile) notFound();
  // Mirrors the server rule; the API enforces it regardless
  if ((profile.isSuperAdmin || profile.isAdmin) && !ctx.isSuperAdmin) redirect(`/users/${id}`);

  return (
    <PageShell title="Edit User">
      <EditUserForm
        profile={profile}
        roles={roles.filter(r => r.isActive && (ctx.isSuperAdmin || !r.isSuperAdmin)).map(r => ({ id: r.id, name: r.name }))}
        departments={departments}
        isSelf={profile.id === ctx.userId}
        actorIsSuperAdmin={ctx.isSuperAdmin}
      />
    </PageShell>
  );
}
