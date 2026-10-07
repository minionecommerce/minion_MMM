'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ITEM_IMAGE_MAX_MB, MAX_ITEM_IMAGES, MAX_OTHER_IMAGES, isItemImageName } from '@/lib/quotes/item-constants';
import { discardItemImage, uploadItemImage } from './item-client';
import { Spinner } from './ui';

// One picture of the item: kept as it was saved (a link through the server) or as it was uploaded in this form (shown from the file itself until the item is saved)
export type Pic = { id: string; fileName: string; size: number; src: string; fresh: boolean };
export type Pics = { front: Pic[]; rear: Pic[]; other: Pic[] };
export const picCount = (p: Pics) => p.front.length + p.rear.length + p.other.length;

type Slot = 'front' | 'rear' | 'other';
const dashed = 'border border-dashed border-[#c3c7d4] rounded-[8px] bg-white';
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

// Front View / Rear View: one picture, a dashed box with "Upload Front Image" until there is one
function SingleSlot({ slot, label, button, pic, uploading, over, onFiles, onRemove, setOver }: {
  slot: 'front' | 'rear'; label: string; button: string; pic: Pic | undefined; uploading: boolean; over: boolean;
  onFiles: (slot: Slot, files: File[]) => void; onRemove: (slot: Slot, pic: Pic) => void; setOver: (slot: Slot | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-[13px] text-[#22263b] mb-[10px]">{label}</div>
      <input ref={input} type="file" accept={ACCEPT} hidden aria-label={`Upload ${label.toLowerCase()} picture`} onChange={e => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; onFiles(slot, picked); }} />
      <div className={`relative h-[80px] ${dashed} ${over ? '!border-[#548df6] bg-[#f3f7ff]' : ''}`}
        onDragOver={e => { e.preventDefault(); setOver(slot); }} onDragLeave={() => setOver(null)} onDrop={e => { e.preventDefault(); setOver(null); onFiles(slot, Array.from(e.dataTransfer.files ?? [])); }} data-image-slot={slot}>
        {pic ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pic.src} alt={`${label} of the item`} className="w-full h-full object-contain rounded-[8px]" />
            <button type="button" onClick={() => onRemove(slot, pic)} aria-label={`Remove the ${label.toLowerCase()} picture`} className="absolute -top-2 -right-2 w-[20px] h-[20px] rounded-full bg-white border border-[#d7d5e1] shadow flex items-center justify-center text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="w-full h-full flex items-center justify-center gap-[8px] text-[13px] text-[#22263b] hover:bg-[#f9f9fb] rounded-[8px] disabled:opacity-60">
            {uploading ? <Spinner className="w-4 h-4 text-[#548df6]" /> : <ArrowUp className="w-4 h-4 text-[#548df6]" aria-hidden />}
            {button}
          </button>
        )}
      </div>
    </div>
  );
}

// Other Images: a tall box to drop pictures on; the pictures that are in it are small squares
function OtherSlot({ pics, uploading, over, full, onFiles, onRemove, setOver }: {
  pics: Pic[]; uploading: number; over: boolean; full: boolean;
  onFiles: (slot: Slot, files: File[]) => void; onRemove: (slot: Slot, pic: Pic) => void; setOver: (slot: Slot | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-[13px] text-[#22263b] mb-[10px]">Other Images</div>
      <input ref={input} type="file" accept={ACCEPT} multiple hidden aria-label="Upload other pictures" onChange={e => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; onFiles('other', picked); }} />
      <div className={`relative h-[200px] ${dashed} ${over ? '!border-[#548df6] bg-[#f3f7ff]' : ''} flex flex-col`}
        onDragOver={e => { e.preventDefault(); setOver('other'); }} onDragLeave={() => setOver(null)} onDrop={e => { e.preventDefault(); setOver(null); onFiles('other', Array.from(e.dataTransfer.files ?? [])); }} data-image-slot="other">
        {pics.length === 0 && uploading === 0 ? (
          <button type="button" onClick={() => input.current?.click()} className="flex-1 flex flex-col items-center justify-center px-[14px] text-center hover:bg-[#f9f9fb] rounded-[8px]">
            <ArrowUpCircle className="w-[22px] h-[22px] text-[#548df6]" strokeWidth={2.4} aria-hidden />
            <span className="mt-[10px] text-[13px] font-semibold text-[#22263b]">Drag &amp; Drop Images</span>
            <span className="mt-[6px] text-[12px] leading-[17px] text-[#6d7189]">You can add up to {MAX_ITEM_IMAGES} images including front, rear and other images, each not exceeding {ITEM_IMAGE_MAX_MB} MB.</span>
          </button>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto q-scroll p-[8px] grid grid-cols-3 gap-[6px] content-start">
              {pics.map(pic => (
                <li key={pic.id} className="relative h-[50px] rounded-[4px] border border-[#ebeaf2] bg-[#f9f9fb]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pic.src} alt={pic.fileName} title={pic.fileName} className="w-full h-full object-cover rounded-[4px]" />
                  <button type="button" onClick={() => onRemove('other', pic)} aria-label={`Remove ${pic.fileName}`} className="absolute -top-1.5 -right-1.5 w-[16px] h-[16px] rounded-full bg-white border border-[#d7d5e1] shadow flex items-center justify-center text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-3 h-3" /></button>
                </li>
              ))}
              {Array.from({ length: uploading }).map((_, i) => <li key={`u${i}`} className="h-[50px] rounded-[4px] border border-dashed border-[#d7d5e1] flex items-center justify-center"><Spinner className="w-4 h-4 text-[#9ca0ab]" /></li>)}
            </ul>
            <button type="button" onClick={() => input.current?.click()} disabled={full} className="h-[34px] border-t border-dashed border-[#c3c7d4] text-[13px] text-[#548df6] hover:bg-[#f9f9fb] inline-flex items-center justify-center gap-1.5 rounded-b-[8px] disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-3.5 h-3.5" aria-hidden /> Add more images</button>
          </>
        )}
      </div>
    </div>
  );
}

// The picture card at the right of the New Item form: Front View, Rear View and Other Images (drag and drop), 15 pictures in all
export default function ItemImageCard({ pics, onChange, onBusy }: { pics: Pics; onChange: (next: Pics) => void; onBusy: (delta: number) => void }) {
  const toast = useToast();
  const current = useRef(pics); // the pictures as they are right now, for uploads that finish one after the other
  const [uploading, setUploading] = useState<Record<Slot, number>>({ front: 0, rear: 0, other: 0 });
  const [over, setOver] = useState<Slot | null>(null);
  useEffect(() => { current.current = pics; });

  const pending = uploading.front + uploading.rear + uploading.other;
  const full = MAX_ITEM_IMAGES - picCount(pics) - pending <= 0 || pics.other.length >= MAX_OTHER_IMAGES;

  const commit = (next: Pics) => { current.current = next; onChange(next); };
  const forget = (pic: Pic) => { if (pic.fresh) { URL.revokeObjectURL(pic.src); void discardItemImage(pic.id); } };

  const add = async (slot: Slot, picked: File[]) => {
    const images = picked.filter(f => {
      if (isItemImageName(f.name)) return true;
      toast.error(`${f.name}: not a picture. Use a PNG, JPG, WEBP or GIF picture.`);
      return false;
    });
    const room = () => MAX_ITEM_IMAGES - picCount(current.current) - pending;
    const take = slot === 'other' ? images.slice(0, Math.max(0, Math.min(MAX_OTHER_IMAGES - current.current.other.length, room()))) : images.slice(0, 1);
    if (images.length > take.length) toast.error(slot === 'other' ? `An item can have ${MAX_ITEM_IMAGES} pictures at most` : `Only one picture can be the ${slot} view`);
    if (slot !== 'other' && take.length && room() <= 0 && current.current[slot].length === 0) { toast.error(`An item can have ${MAX_ITEM_IMAGES} pictures at most`); return; }
    for (const file of take) {
      setUploading(u => ({ ...u, [slot]: u[slot] + 1 }));
      onBusy(1);
      try {
        const saved = await uploadItemImage(slot, file);
        const pic: Pic = { id: saved.id, fileName: saved.fileName, size: saved.size, src: URL.createObjectURL(file), fresh: true };
        if (slot === 'other') commit({ ...current.current, other: [...current.current.other, pic] });
        else { current.current[slot].forEach(forget); commit({ ...current.current, [slot]: [pic] }); } // a new front / rear picture replaces the old one
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${file.name}: the upload failed`);
      } finally {
        setUploading(u => ({ ...u, [slot]: u[slot] - 1 }));
        onBusy(-1);
      }
    }
  };

  const remove = (slot: Slot, pic: Pic) => {
    forget(pic);
    commit({ ...current.current, [slot]: current.current[slot].filter(p => p.id !== pic.id) });
  };

  return (
    <div className="w-full lg:w-[416px] shrink-0 rounded-[10px] border border-[#d7d5e1] bg-white p-[16px] grid grid-cols-1 sm:grid-cols-[185px_185px] gap-x-[14px] gap-y-[20px] self-start" data-item-images>
      <div className="flex flex-col gap-[20px]">
        <SingleSlot slot="front" label="Front View" button="Upload Front Image" pic={pics.front[0]} uploading={uploading.front > 0} over={over === 'front'} onFiles={add} onRemove={remove} setOver={setOver} />
        <SingleSlot slot="rear" label="Rear View" button="Upload Rear Image" pic={pics.rear[0]} uploading={uploading.rear > 0} over={over === 'rear'} onFiles={add} onRemove={remove} setOver={setOver} />
      </div>
      <OtherSlot pics={pics.other} uploading={uploading.other} over={over === 'other'} full={full} onFiles={add} onRemove={remove} setOver={setOver} />
    </div>
  );
}
