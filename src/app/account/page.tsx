import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import { getUserProfile } from '@/lib/users/queries';
import { getUserLayout } from '@/lib/users/layout';
import { ProfileView } from '@/components/users/ProfileView';

export const dynamic = 'force-dynamic';

// Every signed-in user can see their own profile
export default async function AccountPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (ctx.mustChangePassword) redirect('/account/change-password');
  const [profile, layout] = await Promise.all([getUserProfile(ctx.userId), getUserLayout()]);
  if (!profile) redirect('/login');

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white p-4 sm:p-6">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-yellow-400">MY ACCOUNT</div>
          <h1 className="text-[26px] font-black tracking-tight uppercase">My Profile</h1>
        </div>
        <ProfileView profile={profile} isSelf layout={layout} />
      </div>
    </div>
  );
}
