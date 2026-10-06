import { can, requirePageAccess } from '@/lib/auth';
import { getOverview } from '@/lib/attendance/service';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

// Everyone with Attendance access sees their own attendance, and only their own
export default async function AttendancePage() {
  const ctx = await requirePageAccess(['attendance']);
  const initial = await getOverview(ctx);
  return <AttendanceClient initial={initial} canMark={can(ctx, 'attendance', 'create')} />;
}
