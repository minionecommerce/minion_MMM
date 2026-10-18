import { can, requirePageAccess } from '@/lib/auth';
import { getDashboardLayout } from '@/lib/dashboard/layout';
import { getQuickActions } from '@/lib/dashboard/quick-actions';
import { getDashboardMetrics } from '@/lib/dashboard/service';
import { getLayout } from '@/lib/records/layout';
import { convertFieldsOf } from '@/lib/projects/convert';
import MyDashboardClient from './MyDashboardClient';

export const dynamic = 'force-dynamic';

// My Dashboard: the signed-in person's own numbers. Opens on Today.
export default async function MyDashboardPage() {
  const ctx = await requirePageAccess(['dashboard', 'my_work']);
  const canConvert = can(ctx, 'deals', 'edit') && can(ctx, 'projects', 'create');
  const [initial, layout, quickActions, projectLayout] = await Promise.all([
    getDashboardMetrics(ctx, { mode: 'today' }),
    getDashboardLayout(),
    getQuickActions(ctx),
    canConvert ? getLayout('project') : Promise.resolve(null), // the New Project quick action opens the Convert to Project popup
  ]);
  return <MyDashboardClient initial={initial} layout={layout} quickActions={quickActions} canEditLayout={ctx.isSuperAdmin} convertFields={projectLayout ? convertFieldsOf(projectLayout) : []} />;
}
