'use client';

import { useState } from 'react';
import { Copy, Mail, MessageCircle, Link2 } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { formatMoney, formatQuoteDay } from '@/lib/quotes/format';
import type { QuoteDto, QuoteSettings, ShareInfo } from '@/lib/quotes/types';
import { Button, Modal, Spinner, inputClass } from './ui';

const label = 'block text-[13px] text-[#22263b] mb-1';

// {NUMBER} {COMPANY} {CUSTOMER} {TOTAL} {EXPIRY} {LINK} in the message templates of Quote Settings
export function fillTemplate(text: string, vars: { NUMBER: string; COMPANY: string; CUSTOMER: string; TOTAL: string; EXPIRY: string; LINK: string }): string {
  const source = vars.EXPIRY ? text : text.split('\n').filter(l => !l.includes('{EXPIRY}')).join('\n');
  return source.replace(/\{(NUMBER|COMPANY|CUSTOMER|TOTAL|EXPIRY|LINK)\}/g, (_, k: keyof typeof vars) => vars[k]);
}

const expiryText = (iso: string | null | undefined) => (iso ? formatQuoteDay(iso.slice(0, 10)) : '');

// ---------------------------------------------------------------------------
// Send: by e-mail, by WhatsApp, or just the link. The CRM has no mail server: the person's own mail program (or WhatsApp) opens with the message
// ready, and the CRM records that the quote was sent and marks it Sent.
// ---------------------------------------------------------------------------
export function SendModal({ quote, settings, onClose, onSent }: { quote: QuoteDto; settings: QuoteSettings; onClose: () => void; onSent: (status: string) => void }) {
  const toast = useToast();
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'link'>('email');
  const [to, setTo] = useState(quote.customer?.email ?? '');
  const [phone, setPhone] = useState(quote.customer?.phone ?? '');
  const day = typeof quote.values.expiryDate === 'string' ? quote.values.expiryDate : '';
  const vars = (link: string) => ({
    NUMBER: quote.quoteNumber, COMPANY: settings.company.name || 'us', CUSTOMER: quote.customer?.name ?? '', TOTAL: formatMoney(quote.totals.total, settings.display.currencySymbol, settings.display.grouping),
    EXPIRY: formatQuoteDay(day), LINK: link,
  });
  const preLink = quote.share.url ?? '(the link is created when you send)';
  const [subject, setSubject] = useState(() => fillTemplate(settings.templates.emailSubject, vars(preLink)));
  const [message, setMessage] = useState(() => fillTemplate(settings.templates.emailBody, vars(preLink)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setError('');
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) { setError('Enter the e-mail address to send the quote to.'); return; }
    const digits = phone.replace(/[^\d]/g, '');
    if (channel === 'whatsapp' && digits.length < 7) { setError('Enter the WhatsApp number to send the quote to.'); return; }
    setBusy(true);
    try {
      const res = await callApi<{ status: string; share: ShareInfo }>(`/api/quotes/${quote.id}/send`, 'POST', { channel, to: channel === 'email' ? to.trim() : channel === 'whatsapp' ? phone.trim() : undefined });
      const link = res.share.url ?? '';
      const text = message.split(preLink).join(link);
      if (channel === 'email') {
        window.location.href = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      } else if (channel === 'whatsapp') {
        const number = digits.length === 10 ? `91${digits}` : digits;
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      } else {
        try { await navigator.clipboard.writeText(link); toast.success('The link is copied'); } catch { toast.info(link); }
      }
      toast.success(`${quote.quoteNumber} marked as sent`);
      onSent(res.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the quote');
    } finally {
      setBusy(false);
    }
  };

  const tab = (c: typeof channel, text: string, icon: React.ReactNode) => (
    <button type="button" onClick={() => { setChannel(c); setError(''); }} aria-pressed={channel === c} className={`inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[4px] border text-[13px] ${channel === c ? 'border-[#548df6] bg-[#f1f1fa] text-[#355bd4] font-medium' : 'border-[#d7d5e1] hover:bg-[#f9f9fb]'}`}>{icon}{text}</button>
  );

  return (
    <Modal title={`Send ${quote.quoteNumber}`} onClose={onClose} busy={busy} width={620} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button kind="blue" onClick={send} busy={busy}>{channel === 'link' ? 'Create link and mark as sent' : 'Send'}</Button>
      </>
    )}>
      <div className="space-y-3 text-[13px]">
        <div className="flex flex-wrap gap-2">{tab('email', 'E-mail', <Mail className="w-3.5 h-3.5" />)}{tab('whatsapp', 'WhatsApp', <MessageCircle className="w-3.5 h-3.5" />)}{tab('link', 'Link only', <Link2 className="w-3.5 h-3.5" />)}</div>
        {error && <p role="alert" className="text-[#d9232b]">{error}</p>}
        {channel === 'email' && (
          <>
            <div><label htmlFor="sd-to" className={label}>To</label><input id="sd-to" type="email" autoFocus value={to} onChange={e => setTo(e.target.value)} placeholder="customer@example.com" className={inputClass()} /></div>
            <div><label htmlFor="sd-subject" className={label}>Subject</label><input id="sd-subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} className={inputClass()} /></div>
          </>
        )}
        {channel === 'whatsapp' && (
          <div><label htmlFor="sd-phone" className={label}>WhatsApp number</label><input id="sd-phone" autoFocus value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="9876543210" className={inputClass()} /></div>
        )}
        {channel !== 'link' && (
          <div><label htmlFor="sd-message" className={label}>Message</label><textarea id="sd-message" value={message} onChange={e => setMessage(e.target.value)} rows={9} maxLength={5000} className={`${inputClass()} h-auto py-2 leading-[18px]`} /></div>
        )}
        <p className="text-[#6d7189]">{channel === 'link' ? 'A link is made that shows this quote to anyone who has it, without signing in. It works for ' + settings.templates.shareValidDays + ' days.' : 'Your own ' + (channel === 'email' ? 'mail program' : 'WhatsApp') + ' opens with this message ready to send. The quote is marked as Sent and the link in the message shows the quote to the customer without signing in.'}</p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Share: the link of the quote
// ---------------------------------------------------------------------------
export function ShareModal({ quote, initial, onClose, onChanged }: { quote: QuoteDto; initial: ShareInfo | null; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [share, setShare] = useState<ShareInfo | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const make = async () => {
    setBusy(true);
    setError('');
    try { setShare((await callApi<{ share: ShareInfo }>(`/api/quotes/${quote.id}/share`, 'POST')).share); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not create the link'); }
    finally { setBusy(false); }
  };

  const stop = async () => {
    setBusy(true);
    try { await callApi(`/api/quotes/${quote.id}/share`, 'DELETE'); setShare(null); onChanged(); toast.success('The link is switched off'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not switch the link off'); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!share?.url) return;
    try { await navigator.clipboard.writeText(share.url); toast.success('Link copied'); } catch { toast.info(share.url); }
  };

  return (
    <Modal title="Share Quote" onClose={onClose} busy={busy} width={560} footer={<Button onClick={onClose}>Close</Button>}>
      <div className="space-y-3 text-[13px]">
        {error && <p role="alert" className="text-[#d9232b]">{error}</p>}
        {busy && !share && <p className="flex items-center gap-2 text-[#6d7189]"><Spinner className="w-3.5 h-3.5" /> Making the link…</p>}
        {share?.url ? (
          <>
            <p>Anyone with this link can see this quote (not edit it) without signing in.</p>
            <div className="flex gap-2">
              <input readOnly value={share.url} aria-label="Share link" onFocus={e => e.currentTarget.select()} className={inputClass(false, 'flex-1')} />
              <Button kind="blue" onClick={copy}><Copy className="w-3.5 h-3.5" /> Copy</Button>
            </div>
            <p className="text-[#6d7189]">{share.expiresAt ? `The link works until ${expiryText(share.expiresAt)}.` : 'The link does not expire.'}</p>
            <Button kind="ghost" onClick={stop} busy={busy}>Switch the link off</Button>
          </>
        ) : !busy && (
          <>
            <p>There is no link right now. Nobody can open this quote without signing in.</p>
            <Button kind="blue" onClick={make} busy={busy}>Create a link</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
