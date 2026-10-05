import { notFound, redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { getUserProfile, listDepartments } from '@/lib/users/queries';
import { getUserLayout } from '@/lib/users/layout';
import { PageShell } from '../../UsersNav';
import EditUserForm from './EditUserForm';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageAccess(['users'], 'edit');
  const { id } = await params;
  // Editing accounts and Access is a Super Admin feature (the API enforces it too)
  if (!ctx.isSuperAdmin) redirect(`/users/${id}`);
  const [profile, departments, layout] = await Promise.all([getUserProfile(id), listDepartments(), getUserLayout()]);
  if (!profile) notFound();

  return (
    <PageShell title="Edit User">
      <EditUserForm layout={layout} profile={profile} departments={departments} isSelf={profile.id === ctx.userId} />
    </PageShell>
  );
}
