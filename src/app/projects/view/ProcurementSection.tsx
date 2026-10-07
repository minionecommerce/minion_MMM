'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { LayoutSection } from '@/lib/records/types';
import LightConfirm from '@/app/leads/components/LightConfirm';
import { blueButton, buildColumns, greenButton, RowField, Section, SectionTable, useProject } from './common';

// MATERIAL PROCUREMENT: a block for each material (MATERIAL 1, MATERIAL 2 ...). The Item Name is one of the items of the accepted quotes; after it is
// chosen, the block's table shows. The vendors here are typed (they do not have to be in the vendor lists): name, number, location, quote value,
// the quote bill, size and notes. Add Row + adds a row to type in; Add Material + adds another block with its own item, rows and files.
export default function ProcurementSection({ section }: { section: LayoutSection }) {
  const { detail, layout, canEdit, call, fail } = useProject();
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ kind: 'block' | 'row'; id: string; text: string } | null>(null);
  const columns = buildColumns(layout, section.id);
  const { blocks, itemChoices } = detail.procurement;

  const run = async (key: string, path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) => {
    setBusy(key);
    try { await call(path, method, body); } catch (e) { fail(e); } finally { setBusy(null); }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const target = removing;
    setRemoving(null);
    await run(`remove-${target.id}`, target.kind === 'block' ? `/procurement/${target.id}` : `/procurement-rows/${target.id}`, 'DELETE');
  };

  const addMaterial = canEdit && (
    <button type="button" onClick={() => void run('add-block', '/procurement', 'POST')} disabled={busy !== null} className={greenButton}>
      {busy === 'add-block' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Add Material
    </button>
  );

  return (
    <Section id={section.id} title={section.label} actions={addMaterial}>
      {blocks.length === 0 && <p className="text-[13px] text-gray-500">No material yet. Use Add Material to start one.</p>}
      {blocks.map((block, bi) => {
        const known = itemChoices.some(c => c.id === block.quoteItemId);
        const chosen = !!block.quoteItemId || !!block.itemLabel;
        return (
          <div key={block.id} className={bi > 0 ? 'mt-7' : ''} data-procurement-block={block.id}>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-[14px] font-bold text-[#222] uppercase tracking-wide">Material {bi + 1}</h3>
              <label className="flex items-center gap-2 text-[13px] text-[#444]">
                Item Name
                <select
                  value={block.quoteItemId ?? ''}
                  disabled={!canEdit || busy !== null}
                  onChange={e => void run(`item-${block.id}`, `/procurement/${block.id}`, 'PUT', { quoteItemId: e.target.value || null })}
                  aria-label={`Item Name of material ${bi + 1}`}
                  className="h-[34px] min-w-[220px] max-w-[360px] border border-gray-300 rounded px-2 text-[13px] bg-white disabled:bg-gray-50"
                >
                  <option value="">-Select item-</option>
                  {!known && block.itemLabel && <option value="" disabled>{block.itemLabel} (removed from the quote)</option>}
                  {itemChoices.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              {canEdit && (
                <button type="button" onClick={() => setRemoving({ kind: 'block', id: block.id, text: `Material ${bi + 1}${block.itemLabel ? ` (${block.itemLabel})` : ''}` })} aria-label={`Remove material ${bi + 1}`} className="ml-auto w-8 h-8 inline-flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:text-[#d9232b] hover:border-[#d9232b]"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            {!chosen ? (
              <p className="text-[13px] text-gray-500 border border-dashed border-gray-300 rounded px-3 py-4">Choose the Item Name to start this material&apos;s table.{itemChoices.length === 0 ? ' (There are no items yet: they come from the accepted quotes of the deal.)' : ''}</p>
            ) : (
              <>
                <SectionTable
                  columns={columns}
                  rows={block.rows}
                  empty="No row yet."
                  extraHead={canEdit ? <th scope="col" className="w-[44px] border-b border-gray-200 bg-[#f3f4f6] px-2 py-2"><span className="sr-only">Remove row</span></th> : undefined}
                  rowActions={canEdit ? row => <button type="button" onClick={() => setRemoving({ kind: 'row', id: row.id, text: 'this row' })} aria-label="Remove row" className="text-gray-400 hover:text-[#d9232b]"><Trash2 className="w-4 h-4" /></button> : undefined}
                  cell={(f, row, i) => (f.key === 'prNo' ? <span className="block text-center">{i + 1}</span> : <RowField field={f} row={row} path={`/procurement-rows/${row.id}`} />)}
                />
                {canEdit && (
                  <button type="button" onClick={() => void run(`row-${block.id}`, `/procurement/${block.id}/rows`, 'POST')} disabled={busy !== null} className={`${blueButton} mt-3`}>
                    {busy === `row-${block.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Add Row
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      {removing && (
        <LightConfirm title="Remove?" confirmLabel="Remove" danger busy={false} onCancel={() => setRemoving(null)} onConfirm={() => void confirmRemove()}>
          <p>{removing.kind === 'block' ? `${removing.text} with all its rows and files will be removed.` : 'This row and its files will be removed.'}</p>
        </LightConfirm>
      )}
    </Section>
  );
}
