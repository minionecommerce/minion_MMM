import { notFound } from 'next/navigation';
import { can, requirePageAccess } from '@/lib/auth';
import { getUserProfile } from '@/lib/users/queries';
import { getUserLayout } from '@/lib/users/layout';
import { ProfileView } from '@/components/users/ProfileView';
import { PageShell } from '../UsersNav';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageAccess(['users']);
  const { id } = await params;
  const [profile, layout] = await Promise.all([getUserProfile(id), getUserLayout()]);
  if (!profile) notFound();

  return (
    <PageShell title="User Profile">
      <ProfileView
        layout={layout}
        profile={profile}
        isSelf={profile.id === ctx.userId}
        abilities={{ canEdit: can(ctx, 'users', 'edit'), canDelete: can(ctx, 'users', 'delete'), isSuperAdmin: ctx.isSuperAdmin }}
      />
    </PageShell>
  );
}
