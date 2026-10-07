// Browser helpers of the Item Master: the lists of the New Item form and the pictures of an item.
import { callApi } from '@/lib/leads/client';
import type { FileDto, LookupItem } from '@/lib/records/types';
import { ITEM_IMAGE_FIELDS, ITEM_IMAGE_HINT, ITEM_IMAGE_MAX_BYTES, ITEM_IMAGE_MAX_MB, isItemImageName, type ItemKind } from '@/lib/quotes/item-constants';
import type { CodeSuggestions } from '@/lib/quotes/types';
import { discardRecordFile, uploadRecordFile } from '../records/client';
import type { ComboItem } from './ui';

// The module the pictures of an item are uploaded to (/api/records/quote-items/uploads)
export const ITEM_SLUG = 'quote-items';

// The address of a picture of a saved item: the server sends the browser on to a short-lived link
export const itemImageSrc = (fileId: string) => `/api/quotes/items/image/${encodeURIComponent(fileId)}`;

// What the catalogue already uses (and the standard choices), for the lists of the New Item form
export async function searchItemOptions(kind: 'categories' | 'units' | 'accounts' | 'purchaseAccounts', q: string): Promise<ComboItem[]> {
  const res = await callApi<{ items: LookupItem[] }>(`/api/quotes/items/options?kind=${kind}&q=${encodeURIComponent(q)}`, 'GET');
  return res.items;
}

// The HSN code (Goods) or SAC (Service) that fits an item name, worked out on the server from the built-in code tables
export const suggestItemCode = (name: string, kind: ItemKind) =>
  callApi<CodeSuggestions>(`/api/quotes/items/suggest-code?kind=${kind}&name=${encodeURIComponent(name)}`, 'GET');

// One picture to the private Storage bucket; it belongs to the item once the item is saved
export async function uploadItemImage(slot: keyof typeof ITEM_IMAGE_FIELDS, file: File): Promise<FileDto> {
  if (!isItemImageName(file.name)) throw new Error(`${file.name}: not a picture. ${ITEM_IMAGE_HINT}`);
  if (file.size > ITEM_IMAGE_MAX_BYTES) throw new Error(`${file.name}: larger than ${ITEM_IMAGE_MAX_MB} MB`);
  return uploadRecordFile(ITEM_SLUG, ITEM_IMAGE_FIELDS[slot], file);
}

// A picture that was uploaded in this form and not saved yet is thrown away when it is removed
export const discardItemImage = (id: string) => discardRecordFile(ITEM_SLUG, id);
