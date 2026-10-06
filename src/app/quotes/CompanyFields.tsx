'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { callApi, uploadToSignedUrl } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import type { CompanySettings } from '@/lib/quotes/types';
import { Button, inputClass } from './ui';

// The company details of the quote document: the text block under the logo, the logo and the signature / seal, and the bank details.
// Used by Quote Settings and by the Quote document window of Edit Page Layout, so both change the same thing in the same way.
export type CompanyImages = { logo: string | null; signature: string | null };
export type CompanyPart = 'details' | 'pictures' | 'bank';

const lab = 'block text-[13px] text-[#22263b] mb-1';

export function CompanyFields({ value, onChange, images, onImages, edit, parts = ['details', 'pictures', 'bank'], idPrefix = 'co', onUploading, bankTitle = true }: {
  value: CompanySettings;
  onChange: <K extends keyof CompanySettings>(key: K, v: CompanySettings[K]) => void;
  images: CompanyImages;
  onImages: (images: CompanyImages) => void;
  edit: boolean;
  parts?: CompanyPart[];
  idPrefix?: string;
  onUploading?: (busy: boolean) => void;
  bankTitle?: boolean;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState<null | 'logo' | 'signature'>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const signInput = useRef<HTMLInputElement>(null);

  const upload = async (kind: 'logo' | 'signature', file: File) => {
    setUploading(kind);
    onUploading?.(true);
    try {
      const signed = await callApi<{ id: string; uploadUrl: string }>('/api/quotes/settings/files', 'POST', { kind, name: file.name, size: file.size });
      await uploadToSignedUrl(signed.uploadUrl, file);
      const done = await callApi<{ file: { id: string; url: string | null } }>(`/api/quotes/settings/files/${signed.id}`, 'PUT');
      if (kind === 'logo') onChange('logoFileId', done.file.id);
      else onChange('signatureFileId', done.file.id);
      onImages({ ...images, [kind]: done.file.url });
      toast.info('The picture is ready. Save to use it on quotes.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not upload the picture');
    } finally {
      setUploading(null);
      onUploading?.(false);
    }
  };

  const text = (k: keyof CompanySettings, label: string, opts: { max?: number; wide?: boolean; id: string }) => (
    <div className={opts.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={`${idPrefix}-${opts.id}`} className={lab}>{label}</label>
      <input id={`${idPrefix}-${opts.id}`} value={(value[k] as string) ?? ''} disabled={!edit} onChange={e => onChange(k, e.target.value as never)} maxLength={opts.max ?? 200} className={inputClass()} />
    </div>
  );

  const picture = (kind: 'logo' | 'signature', title: string, url: string | null, input: React.RefObject<HTMLInputElement | null>, fileId: string | null) => (
    <div>
      <div className={lab}>{title}</div>
      <div className="flex items-center gap-3">
        <div className="w-[110px] h-[80px] border border-dashed border-[#d7d5e1] rounded-[4px] bg-[#f9f9fb] flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url && fileId ? <img src={url} alt={title} className="max-w-full max-h-full object-contain" /> : <span className="text-[12px] text-[#9ca0ab]">None</span>}
        </div>
        {edit && (
          <div className="space-y-1.5">
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label={`Upload ${title}`} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(kind, f); }} />
            <Button kind="ghost" onClick={() => input.current?.click()} busy={uploading === kind}><Upload className="w-3.5 h-3.5" /> {fileId ? 'Replace' : 'Upload'}</Button>
            {fileId && <div><button type="button" onClick={() => { onChange(kind === 'logo' ? 'logoFileId' : 'signatureFileId', null); onImages({ ...images, [kind]: null }); }} className="text-[13px] text-[#d9232b] hover:underline">Remove</button></div>}
            <p className="text-[12px] text-[#6d7189]">PNG, JPG or WEBP, up to 2 MB</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {parts.map((part, i) => (
        <div key={part} className={i > 0 ? 'mt-4 border-t border-[#ebeaf2] pt-4' : ''}>
          {part === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {text('name', 'Company name', { id: 'name', wide: true })}
              {text('registration', 'Registration line (for example the company ID)', { id: 'reg', wide: true })}
              <div className="sm:col-span-2"><label htmlFor={`${idPrefix}-address`} className={lab}>Address (one line per row)</label><textarea id={`${idPrefix}-address`} value={value.address} disabled={!edit} onChange={e => onChange('address', e.target.value)} rows={4} maxLength={500} className={`${inputClass()} h-auto py-1.5`} /></div>
              {text('gstin', 'GSTIN', { id: 'gstin', max: 20 })}
              {text('stateCode', 'GST state code (33 = Tamil Nadu)', { id: 'state', max: 2 })}
              {text('phone', 'Phone', { id: 'phone', max: 60 })}
              {text('email', 'Email', { id: 'email' })}
              {text('website', 'Website', { id: 'web', wide: true })}
            </div>
          )}
          {part === 'pictures' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {picture('logo', 'Company logo', images.logo, logoInput, value.logoFileId)}
              {picture('signature', 'Authorised signature / seal', images.signature, signInput, value.signatureFileId)}
            </div>
          )}
          {part === 'bank' && (
            <>
              {bankTitle && <div className="text-[13px] font-semibold mb-3">Bank details</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {text('bankName', 'Bank name', { id: 'bank', max: 100 })}
                {text('bankAccountHolder', 'Account holder', { id: 'holder', max: 100 })}
                {text('bankAccountNumber', 'Account number', { id: 'acc', max: 40 })}
                {text('bankIfsc', 'IFSC code', { id: 'ifsc', max: 20 })}
                {text('bankBranch', 'Branch', { id: 'branch', max: 100 })}
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
}
