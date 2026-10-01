import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import ChangePasswordForm from './ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  return <ChangePasswordForm forced={ctx.mustChangePassword} />;
}
