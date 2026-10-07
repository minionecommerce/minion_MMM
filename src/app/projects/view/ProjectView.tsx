'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import type { LayoutSection, LookupItem, ModuleLayoutDto } from '@/lib/records/types';
import type { ProjectDetail } from '@/lib/projects/types';
import type { TaskOptions } from '@/lib/tasks/types';
import type { FieldCtx } from '@/app/records/components/FieldInput';
import { LayoutEditor } from '@/app/records/layout-editor/LayoutEditor';
import { errorText, grayButton, primaryButton, ProjectContext, refsOf, type ProjectCtx } from './common';
import { Breadcrumb, MoreMenu, StatusPill, Tabs } from './ProjectHeader';
import FormSection from './FormSection';
import SummarySection from './SummarySection';
import ValueInfoSection from './ValueInfoSection';
import VendorSelectionSection from './VendorSelectionSection';
import WorkCoverageSection from './WorkCoverageSection';
import MaterialVendorSection from './MaterialVendorSection';
import ServiceVendorSection from './ServiceVendorSection';
import { ExpensesSection, PaymentsSection } from './RecordsSections';
import TasksSection from './TasksSection';
import ProcurementSection from './ProcurementSection';

// The tabs of the project page and the sections each one holds (in the order of Edit Page Layout). Project Information and every section a Super
// Admin adds with New Section are on Overview.
type TabId = 'overview' | 'value' | 'vendors' | 'payments' | 'tasks' | 'procurement';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'value', label: 'Project Value' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'payments', label: 'Payments' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'procurement', label: 'Procurement' },
];
const TAB_OF: Record<string, TabId> = {
  summary: 'overview',
  valueInfo: 'value',
  vendorSelection: 'vendors', workCoverage: 'vendors', materialVendors: 'vendors', serviceVendors: 'vendors',
  payments: 'payments', expenses: 'payments',
  tasks: 'tasks',
  procurement: 'procurement',
};
const tabOf = (s: LayoutSection): TabId | null => TAB_OF[s.id] ?? (s.kind === 'FORM' ? 'overview' : null);
const isTab = (v: unknown): v is TabId => TABS.some(t => t.id === v);

// The Project page: a header (code / deal number, status, Edit, more actions) and six tabs. Every number is read live from the quotes, payment
// records and tasks of the deal; every change is saved on the spot and the page then shows the project as it is now.
export default function ProjectView({ initial, layout, users, taskOptions, userName, initialTab }: {
  initial: ProjectDetail;
  layout: ModuleLayoutDto;
  users: LookupItem[];
  taskOptions: TaskOptions | null;
  userName: string;
  initialTab?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState(initial);
  const [seen, setSeen] = useState(initial);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<TabId>(isTab(initialTab) ? initialTab : 'overview');
  const base = `/api/projects/${initial.id}`;
  // the page was read again (after Edit Page Layout, or a refresh): show that
  if (seen !== initial) { setSeen(initial); setDetail(initial); }

  const call = useCallback(async <T extends { detail: ProjectDetail }>(path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown): Promise<T> => {
    const res = await callApi<T>(`${base}${path}`, method, body);
    setDetail(res.detail);
    return res;
  }, [base]);

  const fail = useCallback((e: unknown) => toast.error(errorText(e)), [toast]);

  const save = useCallback(async (path: string, values: Record<string, unknown>): Promise<string | null> => {
    const key = Object.keys(values)[0];
    try { await call(path, 'PUT', { values }); return null; } catch (e) { return errorText(e, key); }
  }, [call]);

  const reload = useCallback(async () => {
    try { setDetail((await callApi<{ detail: ProjectDetail }>(base, 'GET')).detail); } catch (e) { toast.error(errorText(e)); }
  }, [base, toast]);

  const fieldCtx: FieldCtx = useMemo(() => ({
    slug: 'projects',
    users,
    approvers: [],
    refs: refsOf(detail),
    picked: {},
    canApprove: false,
    onPick: () => {},
    onBusy: () => {},
  }), [users, detail]);

  const canEdit = detail.abilities.edit;
  const ctx: ProjectCtx = { detail, layout, canEdit, editing: canEdit && editing, fieldCtx, call, save, fail, reload, taskOptions, userName };

  // what the person may see: a section made of other modules' records (payments, expenses, tasks) is left out when they may not see those
  const visible = (s: LayoutSection) => !(s.id === 'payments' && !detail.payments) && !(s.id === 'expenses' && !detail.expenses) && !(s.id === 'tasks' && !detail.tasks);
  const sections = layout.sections.filter(s => tabOf(s) !== null && visible(s));
  const tabs = TABS.filter(t => sections.some(s => tabOf(s) === t.id));
  const active: TabId = tabs.some(t => t.id === tab) ? tab : 'overview';

  // the tab is kept in the address (?tab=vendors), so a refresh or a link comes back to the same tab
  const choose = (id: TabId) => {
    setTab(id);
    const params = new URLSearchParams(window.location.search);
    if (id === 'overview') params.delete('tab'); else params.set('tab', id);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const sectionOf = (s: LayoutSection) => {
    switch (s.id) {
      case 'summary': return <SummarySection key={s.id} section={s} />;
      case 'valueInfo': return <ValueInfoSection key={s.id} section={s} />;
      case 'vendorSelection': return <VendorSelectionSection key={s.id} section={s} />;
      case 'workCoverage': return <WorkCoverageSection key={s.id} section={s} />;
      case 'materialVendors': return <MaterialVendorSection key={s.id} section={s} />;
      case 'serviceVendors': return <ServiceVendorSection key={s.id} section={s} />;
      case 'payments': return <PaymentsSection key={s.id} section={s} />;
      case 'expenses': return <ExpensesSection key={s.id} section={s} />;
      case 'tasks': return <TasksSection key={s.id} section={s} />;
      case 'procurement': return <ProcurementSection key={s.id} section={s} />;
      default: return s.kind === 'FORM' ? <FormSection key={s.id} section={s} /> : null; // Project Information and the sections added in Edit Page Layout
    }
  };

  return (
    <ProjectContext.Provider value={ctx}>
      <div data-light-native className="w-full min-h-screen bg-white text-[#333] font-sans">
        <div className="px-4 sm:px-8 pt-6 pb-16 max-w-[1500px] mx-auto">
          <Breadcrumb code={detail.code} />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <h1 data-project-heading className="text-[26px] sm:text-[30px] font-bold text-[#111] leading-tight">
              <span data-project-code>{detail.code}</span> / <span data-deal-number>{detail.dealNumber}</span>
            </h1>
            <StatusPill />
            <div className="ml-auto flex items-center gap-2">
              {canEdit && (editing ? (
                <button type="button" onClick={() => setEditing(false)} className={primaryButton}><Check className="w-4 h-4" aria-hidden />Done</button>
              ) : (
                <button type="button" onClick={() => { choose('overview'); setEditing(true); }} className={grayButton}><Pencil className="w-3.5 h-3.5" aria-hidden />Edit</button>
              ))}
              <MoreMenu dealNumber={detail.dealNumber} canLayout={detail.abilities.layout} onLayout={() => setLayoutOpen(true)} />
            </div>
          </div>
          <p className="mt-1 text-[14px] text-gray-600">
            <span className="font-medium text-gray-800">{String(detail.values.name ?? '')}</span>
            {detail.customerName && <span className="text-gray-500"> · {detail.customerName}</span>}
            {detail.dealName && <span className="text-gray-400"> · {detail.dealName}</span>}
          </p>

          <Tabs tabs={tabs} active={active} onChange={choose} />
          <div id="project-panel" role="tabpanel" aria-labelledby={`project-tab-${active}`} className="pt-6">
            {sections.filter(s => tabOf(s) === active).map(sectionOf)}
          </div>
        </div>
      </div>
      {layoutOpen && <LayoutEditor moduleId="project" initial={layout} onClose={changed => { setLayoutOpen(false); if (changed) router.refresh(); }} />}
    </ProjectContext.Provider>
  );
}
