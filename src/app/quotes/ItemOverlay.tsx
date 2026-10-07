'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { callApi } from '@/lib/leads/client';
import type { ItemDetailDto, TaxDef } from '@/lib/quotes/types';
import ItemForm from './ItemForm';
import { Button, Spinner } from './ui';

// Where the page content starts: the site navigator is at the left of it (a slim strip on a computer, nothing on a phone, a narrower strip when the menu
// is put away). The window of the form starts there, so the navigator stays visible and usable while an item is added.
const CONTENT = '[data-app-content]';
const contentLeft = () => { const el = document.querySelector(CONTENT); return el ? Math.max(0, Math.round(el.getBoundingClientRect().left)) : 0; };
function watchContentLeft(onChange: () => void) {
  const el = document.querySelector(CONTENT);
  const observer = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null; // the content column changes width when the menu is shown or put away
  if (el && observer) observer.observe(el);
  window.addEventListener('resize', onChange);
  return () => { observer?.disconnect(); window.removeEventListener('resize', onChange); };
}

// The New Item form as a page over the page it was opened from (the quote form, the Items page): New Item (no id) or Edit Item. It leaves the site
// navigator uncovered (and sits under it when the navigator opens), above the page and its menus, under Edit Page Layout (z-80), and it does not close on
// Escape: what was typed would be lost.
export default function ItemOverlay({ itemId, initialName = '', taxes, onClose, onSaved }: {
  itemId: string | null;
  initialName?: string;
  taxes: TaxDef[];
  onClose: () => void;
  onSaved: (item: ItemDetailDto, before: ItemDetailDto | null) => void;
}) {
  const [item, setItem] = useState<ItemDetailDto | null>(null);
  const [error, setError] = useState('');
  const left = useSyncExternalStore(watchContentLeft, contentLeft, () => 0);

  useEffect(() => {
    if (!itemId) return;
    let live = true;
    callApi<{ item: ItemDetailDto }>(`/api/quotes/items/${encodeURIComponent(itemId)}`, 'GET')
      .then(r => { if (live) setItem(r.item); })
      .catch(e => { if (live) setError(e instanceof Error ? e.message : 'Could not open the item'); });
    return () => { live = false; };
  }, [itemId]);

  // z-35: above the page, under the navigator (z-40) so its menu that opens over the content stays on top. top-16: the phone's top bar stays visible.
  return (
    <div className="fixed right-0 bottom-0 top-16 lg:top-0 z-[35] bg-white overflow-y-auto" style={{ left }} role="dialog" aria-modal="true" aria-label={itemId ? 'Edit Item' : 'New Item'} data-item-window>
      {!itemId || item ? (
        <ItemForm item={item} initialName={initialName} taxes={taxes} onCancel={onClose} onSaved={saved => onSaved(saved, item)} />
      ) : (
        <div className="px-6 py-16 text-center text-[13px] text-[#22263b]">
          {error ? (
            <>
              <p role="alert" className="text-[#d9232b]">{error}</p>
              <div className="mt-4"><Button onClick={onClose}>Close</Button></div>
            </>
          ) : (
            <p className="inline-flex items-center gap-2 text-[#6d7189]"><Spinner /> Opening the item…</p>
          )}
        </div>
      )}
    </div>
  );
}
