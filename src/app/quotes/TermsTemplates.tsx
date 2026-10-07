'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Plus, Settings, Trash2 } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { TERMS_CONTENT_MAX, TERMS_MAX_TEMPLATES, TERMS_TITLE_MAX, termsProblem } from '@/lib/quotes/terms';
import type { QuoteSettings, TermsSettings, TermsTemplate } from '@/lib/quotes/types';
import { Button, Modal, inputClass } from './ui';

// ---------------------------------------------------------------------------
// Above the Terms & Conditions of the quote form: the list of templates and the Settings button that opens the window of the templates
// ---------------------------------------------------------------------------
export function TermsPicker({ templates, pickedId, text, onPick, onSettings }: {
  templates: TermsTemplate[];
  pickedId: string; // the template the text came from ('' = none)
  text: string; // the text the quote has now
  onPick: (template: TermsTemplate) => void;
  onSettings: () => void;
}) {
  const picked = templates.find(t => t.id === pickedId) ?? null;
  const edited = !!picked && text.replace(/\r\n?/g, '\n').trim() !== picked.content;
  return (
    <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[6px] mb-[8px]" data-terms-picker>
      <div className="relative w-full max-w-[340px]">
        <select
          id="f-termsTemplate"
          aria-label="Terms & Conditions template"
          value={picked?.id ?? ''}
          onChange={e => { const t = templates.find(x => x.id === e.target.value); if (t) onPick(t); }}
          className={inputClass(false, 'appearance-none pr-8 cursor-pointer')}
        >
          <option value="">{templates.length ? 'Select a template' : 'No templates yet'}</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6d7189] pointer-events-none" aria-hidden />
      </div>
      <button type="button" onClick={onSettings} aria-label="Terms & Conditions templates" title="Terms & Conditions templates" data-terms-settings
        className="w-[34px] h-[34px] shrink-0 inline-flex items-center justify-center rounded-[4px] border border-[#d7d5e1] bg-white text-[#548df6] hover:bg-[#f1f1fa]">
        <Settings className="w-4 h-4" />
      </button>
      {edited && <span className="text-[12px] text-[#6d7189]" data-terms-edited>Edited for this quote</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The window of the templates: the list on the left (Add Template at its bottom), the title and the text of the chosen one on the right.
// Only a Super Admin changes them (they are saved with the Quote Settings); anybody else can read them.
// ---------------------------------------------------------------------------
export function TermsTemplatesModal({ templates, canEdit, activeId, onClose, onSaved }: {
  templates: TermsTemplate[];
  canEdit: boolean;
  activeId?: string; // the template that is open when the window opens
  onClose: () => void;
  onSaved: (terms: TermsSettings) => void;
}) {
  const toast = useToast();
  const [list, setList] = useState<TermsTemplate[]>(() => templates.map(t => ({ ...t })));
  const [active, setActive] = useState<string | null>(() => (templates.some(t => t.id === activeId) ? activeId ?? null : templates[0]?.id ?? null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const made = useRef(0);

  const dirty = JSON.stringify(list) !== JSON.stringify(templates);
  const current = list.find(t => t.id === active) ?? null;
  const isNew = (id: string) => id.startsWith('new_');

  const change = (patch: Partial<TermsTemplate>) => { setList(cur => cur.map(t => (t.id === active ? { ...t, ...patch } : t))); setError(''); };
  const choose = (id: string) => { setActive(id); setError(''); };
  const add = () => {
    if (list.length >= TERMS_MAX_TEMPLATES) { setError(`There can be ${TERMS_MAX_TEMPLATES} templates at most.`); return; }
    made.current += 1;
    const id = `new_${made.current}`;
    setList(cur => [...cur, { id, title: '', content: '' }]);
    setActive(id);
    setError('');
  };
  const remove = () => {
    const at = list.findIndex(t => t.id === active);
    if (at < 0) return;
    const rest = list.filter(t => t.id !== active);
    setList(rest);
    setActive(rest[Math.min(at, rest.length - 1)]?.id ?? null);
    setError('');
  };

  // Changes that are not saved are not thrown away by one stray click: the first try only asks
  const attemptClose = () => {
    if (busy) return;
    if (dirty && !confirmClose) setConfirmClose(true);
    else onClose();
  };

  const save = async () => {
    const problem = termsProblem(list);
    if (problem) { setActive(problem.id); setError(problem.message); return; }
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ settings: QuoteSettings }>('/api/quotes/settings', 'PUT', {
        group: 'terms',
        value: { templates: list.map(t => ({ id: isNew(t.id) ? undefined : t.id, title: t.title, content: t.content })) },
      });
      toast.success('Terms & Conditions templates saved');
      onSaved(res.settings.terms);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the templates');
    } finally {
      setBusy(false);
    }
  };

  const label = 'block text-[13px] text-[#22263b] mb-1';
  return (
    <Modal
      title="Terms & Conditions Templates"
      onClose={attemptClose}
      busy={busy}
      width={880}
      footer={(
        <>
          <Button onClick={attemptClose} disabled={busy}>{canEdit ? 'Cancel' : 'Close'}</Button>
          {canEdit && <Button kind="blue" onClick={save} busy={busy} disabled={!dirty}>Save</Button>}
        </>
      )}
    >
      <div className="space-y-3 text-[13px]" data-terms-window>
        {!canEdit && <p className="rounded-[4px] bg-[#f9f9fb] border border-[#ebeaf2] px-3 py-2 text-[#6d7189]">Only a Super Admin can add or change the templates.</p>}
        {confirmClose && (
          <div role="alert" className="flex flex-wrap items-center gap-2 rounded-[4px] border border-[#f3c2c4] bg-[#fdeeee] px-3 py-2 text-[#b42318]">
            <span className="mr-auto">You have changes that are not saved.</span>
            <Button onClick={() => setConfirmClose(false)}>Keep editing</Button>
            <Button kind="danger" onClick={onClose}>Discard the changes</Button>
          </div>
        )}
        {error && <p role="alert" className="text-[#d9232b]">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-[230px_minmax(0,1fr)] gap-4">
          <div className="border border-[#ebeaf2] rounded-[6px] overflow-hidden self-start">
            <ul aria-label="Templates" className="max-h-[360px] overflow-y-auto q-scroll divide-y divide-[#ebeaf2]">
              {list.map(t => (
                <li key={t.id}>
                  <button type="button" onClick={() => choose(t.id)} aria-current={t.id === active || undefined} data-terms-item
                    className={`w-full text-left px-3 py-[9px] truncate ${t.id === active ? 'bg-[#f1f1fa] font-medium text-[#355bd4]' : 'hover:bg-[#f9f9fb]'}`}>
                    {t.title.trim() || 'New template'}
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="px-3 py-4 text-[#6d7189]">No templates yet.</li>}
            </ul>
            {canEdit && (
              <button type="button" onClick={add} data-terms-add className="w-full border-t border-[#ebeaf2] flex items-center gap-2 px-3 h-[40px] text-[#548df6] hover:bg-[#f1f1fa]">
                <Plus className="w-4 h-4 rounded-full bg-[#548df6] text-white p-[2px]" aria-hidden /> Add Template
              </button>
            )}
          </div>
          <div className="min-w-0">
            {current ? (
              <>
                <label htmlFor="tt-title" className={label}>Template Title{canEdit && <span className="text-[#d93b3b]"> *</span>}</label>
                <input
                  key={current.id}
                  id="tt-title"
                  autoFocus={isNew(current.id)}
                  value={current.title}
                  readOnly={!canEdit}
                  maxLength={TERMS_TITLE_MAX}
                  autoComplete="off"
                  placeholder="Service, Material, Interior ..."
                  onChange={e => change({ title: e.target.value })}
                  className={inputClass(false, canEdit ? '' : 'bg-[#f9f9fb]')}
                />
                <label htmlFor="tt-content" className={`${label} mt-3`}>Terms &amp; Conditions{canEdit && <span className="text-[#d93b3b]"> *</span>}</label>
                <textarea
                  id="tt-content"
                  value={current.content}
                  readOnly={!canEdit}
                  maxLength={TERMS_CONTENT_MAX}
                  rows={12}
                  placeholder="The Terms & Conditions this template puts on a quote"
                  onChange={e => change({ content: e.target.value })}
                  className={inputClass(false, `!h-auto py-2 leading-[20px] resize-y ${canEdit ? '' : 'bg-[#f9f9fb]'}`)}
                />
                <p className="mt-1 text-[12px] text-[#6d7189]">Choosing this template on a quote fills in its Terms &amp; Conditions. The text can still be changed on that quote.</p>
                {canEdit && (
                  <div className="mt-3">
                    <Button kind="ghost" onClick={remove}><Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete Template</Button>
                  </div>
                )}
              </>
            ) : (
              <p className="py-6 text-[#6d7189]">{canEdit ? 'Click Add Template to write the first one.' : 'There are no templates yet.'}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
