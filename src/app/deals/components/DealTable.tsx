'use client';

import type { ColumnFilterKey, DealColumnId } from '@/lib/leads/constants';
import type { DealSortKey } from '@/lib/deals/constants';
import type { DealRow } from '@/lib/deals/queries';
import HeaderCell, { type FilterGroup, type HeaderColumn } from '@/app/leads/components/HeaderCell';
import { CategoryCell, FollowUpCell, LeadStatusCell, LocationCell, RequirementsCell, SourceCell, StaffAssignmentCell, StatusCell, type InlineContext } from '@/app/leads/components/LeadCells';
import DealActions, { type DealActionHandlers } from './DealActions';
import { DealCustomerCell, DealIdCell, DealValidityCell } from './DealCells';

type Abilities = { create: boolean; edit: boolean; delete: boolean };

type Column = HeaderColumn<DealSortKey> & { id: DealColumnId | 'actions' };
// The Leads table's columns, with the Deal ID, Deal Status (instead of Lead Status) and Deal Validity of a deal
const COLUMN_DEFS: Record<DealColumnId, Column> = {
  deal: { id: 'deal', label: 'Deal ID and Date', sort: 'deal', width: 'w-[260px]' },
  followup: { id: 'followup', label: 'Follow-up', width: 'w-[135px]' },
  customer: { id: 'customer', label: 'Customer details', sort: 'customer', width: 'w-[230px]' },
  requirement: { id: 'requirement', label: 'Requirements', sort: 'requirement', width: 'w-[270px]' },
  validity: { id: 'validity', label: 'Deal Validity', sort: 'validity', width: 'w-[140px]' },
  assigned: { id: 'assigned', label: 'Staff Assignment', sort: 'assigned', width: 'w-[130px]' },
  status: { id: 'status', label: 'Deal Status', sort: 'status', width: 'w-[215px]' },
  state: { id: 'state', label: 'Status', filter: 'state', width: 'w-[140px]' },
  source: { id: 'source', label: 'Source', sort: 'source', width: 'w-[110px]' },
  category: { id: 'category', label: 'Categories', sort: 'category', width: 'w-[200px]' },
  location: { id: 'location', label: 'Location', sort: 'location', width: 'w-[210px]' },
};
const ACTIONS_COLUMN: Column = { id: 'actions', label: 'Actions', width: 'w-[110px]' };

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</div>{children}</div>;
}

export default function DealTable({ rows, totalDeals, sort, dir, abilities, loading, columnOrder, filterGroups, onSort, onFilter, onReset, onFollowUp, onViewFollowUps, inline, handlersFor }: {
  rows: DealRow[];
  totalDeals: number; // all deals, whatever the search and filters
  sort?: DealSortKey;
  dir: 'asc' | 'desc';
  abilities: Abilities;
  loading: boolean;
  columnOrder: DealColumnId[];
  filterGroups: Record<string, FilterGroup<ColumnFilterKey>[]>; // by column: its sort key, or "state" for the Status column
  onSort: (k: DealSortKey, d: 'asc' | 'desc') => void;
  onFilter: (next: Partial<Record<ColumnFilterKey, string[]>>) => void;
  onReset: () => void;
  onFollowUp: (row: DealRow) => void;
  onViewFollowUps: (row: DealRow) => void;
  inline: InlineContext; // inline editing of Amount (the Deal Value), Deal Status, Location and Exact Location
  handlersFor: (row: DealRow) => DealActionHandlers;
}) {
  const activeSort = sort ?? 'deal';
  const columns: Column[] = [...columnOrder.map(id => COLUMN_DEFS[id]), ACTIONS_COLUMN];

  const cellFor = (id: DealColumnId, row: DealRow) => {
    switch (id) {
      case 'deal': return <DealIdCell row={row} />;
      case 'followup': return <FollowUpCell row={row} canEdit={abilities.edit} onUpload={() => onFollowUp(row)} onView={() => onViewFollowUps(row)} />;
      case 'customer': return <DealCustomerCell row={row} />;
      case 'requirement': return <RequirementsCell row={row} canEdit={abilities.edit} inline={inline} />;
      case 'validity': return <DealValidityCell row={row} />;
      case 'assigned': return <StaffAssignmentCell row={row} />;
      case 'status': return <LeadStatusCell row={row} canEdit={abilities.edit} inline={inline} status={row.deal.status} />;
      case 'state': return <StatusCell rate={row.conventionalRate} status={row.status} />;
      case 'source': return <SourceCell row={row} />;
      case 'category': return <CategoryCell row={row} />;
      case 'location': return <LocationCell row={row} canEdit={abilities.edit} inline={inline} />;
    }
  };

  const actions = (row: DealRow) => <DealActions canEdit={abilities.edit} canCreate={abilities.create} canDelete={abilities.delete} isClosed={row.isClosed} handlers={handlersFor(row)} />;

  if (totalDeals === 0) {
    return (
      <div className="py-20 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
        <div className="text-[16px] font-semibold text-gray-700">No deals yet</div>
        <div className="text-[13px] mt-1">Convert a lead from the Leads page (the convert icon in Actions) and it will appear here.</div>
      </div>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-[2000px] w-full border-collapse">
          <thead className="bg-[#f3f4f6]">
            <tr>
              {columns.map(c => (
                <HeaderCell key={c.label} col={c} active={!!c.sort && c.sort === activeSort} dir={dir} groups={filterGroups[c.filter ?? c.sort ?? ''] ?? []} onSort={onSort} onFilter={onFilter} onReset={onReset} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="py-16 text-center text-gray-500"><div className="text-[16px] font-semibold text-gray-700">No deals match these filters</div><div className="text-[13px] mt-1">Open a column filter to change it, or use the reset button in Actions.</div></td></tr>
            )}
            {rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 align-middle hover:bg-[#fafafa]">
                {columns.map(c => (
                  c.id === 'actions'
                    ? <td key={c.id} className="px-3 py-2.5 align-middle sticky right-0 z-10 bg-white shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]">{actions(row)}</td>
                    : <td key={c.id} className="px-3 py-2.5 align-middle">{cellFor(c.id, row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet / phone cards */}
      <div className="lg:hidden space-y-4">
        {rows.length === 0 && <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg"><div className="text-[16px] font-semibold text-gray-700">No deals match these filters</div></div>}
        {rows.map(row => (
          <article key={row.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <DealIdCell row={row} />
              {actions(row)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardSection title="Customer details"><DealCustomerCell row={row} /></CardSection>
              <CardSection title="Staff Assignment"><StaffAssignmentCell row={row} /></CardSection>
              <CardSection title="Requirements"><RequirementsCell row={row} canEdit={abilities.edit} inline={inline} /></CardSection>
              <CardSection title="Deal Status"><LeadStatusCell row={row} canEdit={abilities.edit} inline={inline} status={row.deal.status} /></CardSection>
              <CardSection title="Deal Validity"><DealValidityCell row={row} /></CardSection>
              <CardSection title="Categories"><CategoryCell row={row} /></CardSection>
              <CardSection title="Location"><LocationCell row={row} canEdit={abilities.edit} inline={inline} /></CardSection>
              <CardSection title="Source"><SourceCell row={row} /></CardSection>
              <div className="flex gap-6"><CardSection title="Follow-up"><FollowUpCell row={row} canEdit={abilities.edit} onUpload={() => onFollowUp(row)} onView={() => onViewFollowUps(row)} /></CardSection><CardSection title="Status"><StatusCell rate={row.conventionalRate} status={row.status} /></CardSection></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
