'use client';

import { useEffect, useState } from 'react';
import { Boxes, Plus, Wrench, X } from 'lucide-react';
import { searchLookup } from '../client';
import type { FieldCtx } from './FieldInput';
import LookupSelect from './LookupSelect';

export type VendorKind = 'material' | 'service';
export type VendorCreated = { type: 'vendor-created'; kind: VendorKind; id: string; code: string; name: string };
const KINDS: { kind: VendorKind; label: string; hint: string; href: string; Icon: typeof Boxes }[] = [
  { kind: 'material', label: 'Material Vendor', hint: 'Supplies materials and products', href: '/vendor-embed/material', Icon: Boxes },
  { kind: 'service', label: 'Service Vendor', hint: 'Provides labour and services', href: '/vendor-embed/service', Icon: Wrench },
];

// The one Vendor dropdown of Pre-Payment / Payment Collection. Material and Service Vendors are in one list (V1, V2 ...), each with its
// type; picking one fills the right relation and clears the other. "Add Vendor" opens the normal vendor form on top of this page (so
// nothing typed here is lost) and the new vendor is selected here as soon as it is saved.
export default function VendorField({ label, required, materialId, serviceId, onChange, ctx, invalid, htmlId, canAdd }: {
  label: string;
  required: boolean;
  materialId: string;
  serviceId: string;
  onChange: (next: { materialVendorId: string; serviceVendorId: string }) => void;
  ctx: FieldCtx;
  invalid: boolean;
  htmlId: string;
  canAdd: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<VendorKind | null>(null);
  const id = materialId || serviceId;
  const refName = (v?: { code: string; name: string }) => (v ? `${v.code} - ${v.name}` : '');
  const shownText = id ? ctx.picked[id] || refName(ctx.refs.materialVendors[id]) || refName(ctx.refs.serviceVendors[id]) : '';

  const choose = (vendorId: string | null, vendorKind: VendorKind | null) =>
    onChange({ materialVendorId: vendorId && vendorKind === 'material' ? vendorId : '', serviceVendorId: vendorId && vendorKind === 'service' ? vendorId : '' });

  // The vendor form (in the frame below) tells this page which vendor it just saved
  useEffect(() => {
    if (!adding) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const m = e.data as { type?: string; id?: string; kind?: VendorKind; code?: string; name?: string };
      if (m?.type === 'vendor-created' && m.id && m.kind) {
        ctx.onPick(m.id, `${m.code ?? ''} - ${m.name ?? ''}`);
        choose(m.id, m.kind);
        setAdding(false);
        setKind(null);
      } else if (m?.type === 'vendor-cancelled') {
        setAdding(false);
        setKind(null);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adding]);

  const close = () => { setAdding(false); setKind(null); };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <LookupSelect
          htmlId={htmlId}
          value={id || null}
          shown={shownText}
          search={q => searchLookup(ctx.slug, 'vendors', q)}
          onChange={(vendorId, item) => {
            if (vendorId && item) {
              const k = (item.data?.kind as VendorKind | undefined) ?? 'material';
              ctx.onPick(vendorId, item.sub ? `${item.label} - ${item.sub.split(' · ')[0]}` : item.label);
              choose(vendorId, k);
            } else choose(null, null);
          }}
          placeholder="Click to select Vendor"
          ariaLabel={label}
          required={required}
          invalid={invalid}
          emptyText="No vendors found"
        />
      </div>
      {canAdd && (
        <button type="button" onClick={() => setAdding(true)} className="shrink-0 h-[38px] px-3 rounded border border-gray-300 hover:bg-gray-100 text-[13px] font-medium text-gray-800 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      )}

      {adding && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !kind) close(); }}>
          <div role="dialog" aria-modal="true" aria-label="Add Vendor" data-light-native className="bg-white w-full sm:rounded-xl shadow-2xl flex flex-col max-h-screen sm:max-h-[92vh] sm:max-w-[1100px] h-full sm:h-auto" onKeyDown={e => { if (e.key === 'Escape' && !kind) close(); }}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-[18px] font-bold text-[#111827]">Add Vendor</h2>
              <button type="button" onClick={close} aria-label="Close" className="text-gray-400 hover:text-black"><X className="w-6 h-6" /></button>
            </div>
            {!kind ? (
              <div className="p-5">
                <p className="text-[14px] text-gray-600 mb-4">What kind of vendor is it? It gets the next Vendor ID and is selected here when you save.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {KINDS.map(k => (
                    <button key={k.kind} type="button" onClick={() => setKind(k.kind)} className="text-left border border-gray-300 hover:border-[#f5b800] hover:bg-[#fff8dc] rounded-lg p-4 flex items-start gap-3">
                      <k.Icon className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" />
                      <span><span className="block text-[15px] font-semibold text-gray-900">{k.label}</span><span className="block text-[13px] text-gray-500">{k.hint}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <iframe title={`New ${kind} vendor`} src={KINDS.find(k => k.kind === kind)!.href} className="w-full flex-1 min-h-[70vh] border-0" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
