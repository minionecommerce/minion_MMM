'use client';

import { useState } from 'react';
import { FileText, Pencil, Plus, Search } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import type { LookupItem } from '@/lib/records/types';
import type { CustomerDto } from '@/lib/quotes/types';
import { initialOf } from '@/lib/customers/format';
import { CustomerSearchModal } from '../quotes/modals';
import { Combo, type ComboItem } from '../quotes/ui';
import CustomerOverlay from './CustomerOverlay';

// One customer in the list: a round letter, "NAME | CUS-00810", and the company (or contact) under it
function CustomerOption({ c, active }: { c: CustomerDto; active: boolean }) {
  const second = c.companyName || c.contactName || '';
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[13px] ${active ? 'bg-white text-[#6d7189]' : 'bg-[#e9ecf5] text-[#6d7189]'}`}>{initialOf(c.name)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] truncate">
          {c.name}
          {c.code && <><span className={`mx-1.5 ${active ? 'text-white/60' : 'text-[#c3c6d3]'}`}>|</span><span className={active ? 'text-white/85' : 'text-[#6d7189]'}>{c.code}</span></>}
        </span>
        {second && <span className={`flex items-center gap-1 text-[12px] truncate ${active ? 'text-white/85' : 'text-[#6d7189]'}`}><FileText className="w-3 h-3 shrink-0" aria-hidden /><span className="truncate">{second}</span></span>}
      </span>
    </span>
  );
}

// The Customer Name field of a form: a list to search (name, company, phone, email, customer number) with "Add New Customer" at its foot, the blue search
// button, and, once a customer is chosen, an Edit button. Choosing a customer only selects it; the Customer form opens only from Add New Customer or Edit.
export default function CustomerPicker({ htmlId, label, customerId, shown, invalid, canCreate, canEdit, onPick, onClear, className = '' }: {
  htmlId: string;
  label: string;
  customerId: string;
  shown: string;
  invalid?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  onPick: (customer: CustomerDto) => void; // a customer was chosen, or was just saved (new or edited): the form takes its details
  onClear: () => void;
  className?: string;
}) {
  const [window, setWindow] = useState<{ id: string | null } | null>(null);
  const [searching, setSearching] = useState(false);

  const search = async (q: string): Promise<ComboItem[]> => {
    const res = await callApi<{ items: (LookupItem & { customer: CustomerDto })[] }>(`/api/quotes/customers?q=${encodeURIComponent(q)}`, 'GET');
    return res.items.map(i => ({ id: i.id, label: i.label, sub: i.sub, tag: i.tag, data: i.customer }));
  };

  return (
    <div className={`flex items-start gap-0 max-w-full ${className}`}>
      <Combo
        htmlId={htmlId}
        className="w-[509px] max-w-[calc(100%-27px)]"
        value={customerId || null}
        shown={shown}
        search={search}
        placeholder="Select or add a customer"
        ariaLabel={label}
        invalid={invalid}
        emptyText="No customers found"
        roomy
        optionLabel={(item, active) => <CustomerOption c={item.data as CustomerDto} active={active} />}
        onChange={(id, item) => { if (id && item?.data) onPick(item.data as CustomerDto); else onClear(); }}
        footer={close => canCreate && (
          <button type="button" onClick={() => { close(); setWindow({ id: null }); }} className="w-full flex items-center gap-2 px-3 h-[36px] text-[13px] text-[#548df6] hover:bg-[#f1f1fa]"><Plus className="w-3.5 h-3.5" aria-hidden />Add New Customer</button>
        )}
      />
      <button type="button" onClick={() => setSearching(true)} aria-label="Search customers" title="Search customers" className="w-[34px] h-[34px] shrink-0 rounded-r-[4px] bg-[#548df6] hover:bg-[#4a82ea] text-white flex items-center justify-center -ml-px"><Search className="w-3.5 h-3.5" /></button>
      {customerId && canEdit && (
        <button type="button" onClick={() => setWindow({ id: customerId })} aria-label="Edit customer" title="Edit this customer's details" className="ml-3 h-[34px] shrink-0 px-3 inline-flex items-center gap-1.5 rounded-[4px] border border-[#d7d5e1] bg-white text-[13px] text-[#22263b] hover:bg-[#f1f1fa]"><Pencil className="w-3.5 h-3.5 text-[#548df6]" aria-hidden />Edit</button>
      )}
      {searching && (
        <CustomerSearchModal
          onClose={() => setSearching(false)}
          onPick={c => { setSearching(false); onPick(c); }}
          onNew={canCreate ? () => { setSearching(false); setWindow({ id: null }); } : undefined}
        />
      )}
      {window && (
        <CustomerOverlay
          customerId={window.id}
          onClose={() => setWindow(null)}
          onSaved={c => { setWindow(null); onPick(c); }}
        />
      )}
    </div>
  );
}
