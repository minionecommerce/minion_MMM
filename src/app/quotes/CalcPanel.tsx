'use client';

import { ChevronDown, HelpCircle } from 'lucide-react';
import { formatAmount } from '@/lib/quotes/format';
import type { CalcOut, QuoteSettings } from '@/lib/quotes/types';
import type { CalcState } from './form-state';

// The calculation panel: Sub Total -> Discount -> Tax -> Shipping -> TDS / TCS -> Adjustment -> Round Off -> Total, worked out while you type
const box = 'h-[34px] px-[10px] text-[13px] text-right bg-white border border-[#d7d5e1] rounded-[4px] focus:outline-none focus:border-[#548df6]';

function Help({ text }: { text: string }) {
  return <span title={text} aria-label={text} className="inline-flex text-[#6d7189] cursor-help"><HelpCircle className="w-4 h-4" aria-hidden /></span>;
}

export default function CalcPanel({ calc, setCalc, totals, settings, errors, labels, shown }: {
  calc: CalcState;
  setCalc: (patch: Partial<CalcState>) => void;
  totals: CalcOut;
  settings: QuoteSettings;
  errors: Record<string, string>;
  labels: Record<string, string>; // the names the layout gives the rows
  shown: Record<string, boolean>; // which rows the layout shows
}) {
  const { display } = settings;
  const money = (n: number) => formatAmount(n, display.grouping);
  const signed = (n: number) => `${n < 0 ? '-' : ''}${money(Math.abs(n))}`;
  const list = (calc.wKind === 'TDS' ? settings.tds : settings.tcs).filter(t => t.active || t.id === calc.wTaxId);
  const label = (k: string, fallback: string) => labels[k] || fallback;
  const row = 'grid grid-cols-[112px_minmax(0,1fr)_auto] sm:grid-cols-[166px_minmax(0,1fr)_auto] items-center min-h-[54px]';
  const amountCls = 'text-right pr-[4px] text-[13px]';

  return (
    <div className="rounded-[10px] bg-[#f9f9fb] pl-[10px] pr-[10px] pt-[10px] pb-[6px] text-[13px] text-[#22263b]" data-calc-panel>
      <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] sm:grid-cols-[166px_minmax(0,1fr)_auto] items-center min-h-[38px]">
        <span className="font-semibold text-black">Sub Total</span><span />
        <span className={`${amountCls} font-semibold text-black`} data-calc="subTotal">{money(totals.subTotal)}</span>
      </div>

      {shown.discountPercent !== false && (
        <div className={row}>
          <label htmlFor="calc-discount">{label('discountPercent', 'Discount')}</label>
          <div className="flex">
            <input id="calc-discount" value={calc.discount} onChange={e => setCalc({ discount: e.target.value })} inputMode="decimal" aria-invalid={!!errors['calc.discountPercent'] || undefined} className={`${box} w-[95px] rounded-r-none ${errors['calc.discountPercent'] ? '!border-[#e5484d]' : ''}`} placeholder="0" />
            <span className="h-[34px] w-[32px] flex items-center justify-center border border-l-0 border-[#d7d5e1] rounded-r-[4px] bg-white text-[13px]">%</span>
          </div>
          <span className={amountCls} data-calc="discount">{totals.discountAmount ? `-${money(totals.discountAmount)}` : money(0)}</span>
          {errors['calc.discountPercent'] && <p role="alert" className="col-span-3 text-[12px] text-[#d9232b] pb-1">{errors['calc.discountPercent']}</p>}
        </div>
      )}

      {totals.taxes.map(t => (
        <div key={`${t.name}-${t.rate}`} className="grid grid-cols-[112px_minmax(0,1fr)_auto] sm:grid-cols-[166px_minmax(0,1fr)_auto] items-center min-h-[34px]" data-calc-tax>
          <span className="text-[#6d7189]">{t.name} ({t.rate}%)</span><span />
          <span className={amountCls}>{money(t.amount)}</span>
        </div>
      ))}

      {shown.shippingCharges !== false && (
        <div className={row}>
          <label htmlFor="calc-shipping">{label('shippingCharges', 'Shipping Charges')}</label>
          <div className="flex items-center gap-[10px]">
            <input id="calc-shipping" value={calc.shipping} onChange={e => setCalc({ shipping: e.target.value })} inputMode="decimal" aria-invalid={!!errors['calc.shippingCharges'] || undefined} className={`${box} w-[128px] ${errors['calc.shippingCharges'] ? '!border-[#e5484d]' : ''}`} />
            <Help text="The cost of delivering the goods. It is added to the total." />
          </div>
          <span className={amountCls} data-calc="shipping">{money(totals.shipping)}</span>
          {errors['calc.shippingCharges'] && <p role="alert" className="col-span-3 text-[12px] text-[#d9232b] pb-1">{errors['calc.shippingCharges']}</p>}
        </div>
      )}

      {shown.tdsTcsKind !== false && (
        <div className={row}>
          <div className="flex items-center gap-[14px]">
            {(['TDS', 'TCS'] as const).map(k => (
              <label key={k} className="inline-flex items-center gap-[6px] cursor-pointer">
                <input type="radio" name="calc-kind" className="q-radio" checked={calc.wKind === k} onChange={() => setCalc({ wKind: k, wTaxId: '' })} /> {k}
              </label>
            ))}
          </div>
          <div className="relative w-[157px]">
            <select value={calc.wTaxId} onChange={e => setCalc({ wTaxId: e.target.value })} aria-label={`${calc.wKind} rate`} className={`${box} w-full text-left pr-8 appearance-none ${calc.wTaxId ? '' : 'text-[#9ca0ab]'} ${errors['calc.withholding'] ? '!border-[#e5484d]' : ''}`}>
              <option value="">Select a Tax</option>
              {list.map(t => <option key={t.id} value={t.id}>{t.name} [{t.rate}%]</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6d7189] pointer-events-none" aria-hidden />
          </div>
          <span className={`${amountCls} text-[#6d7189]`} data-calc="withholding">{totals.withholdingAmount ? `${totals.withholdingAmount < 0 ? '-' : ''} ${money(Math.abs(totals.withholdingAmount))}` : '- 0.00'}</span>
          {errors['calc.withholding'] && <p role="alert" className="col-span-3 text-[12px] text-[#d9232b] pb-1">{errors['calc.withholding']}</p>}
        </div>
      )}

      {shown.adjustment !== false && (
        <div className={`${row} min-h-[58px]`}>
          <input value={calc.adjLabel} onChange={e => setCalc({ adjLabel: e.target.value })} maxLength={60} aria-label="Adjustment name" className="h-[34px] w-[125px] px-[10px] text-[13px] text-[#22263b] bg-transparent border border-dashed border-[#9ca0ab] rounded-[4px] focus:outline-none focus:border-[#548df6]" />
          <div className="flex items-center gap-[10px]">
            <input value={calc.adjustment} onChange={e => setCalc({ adjustment: e.target.value })} inputMode="decimal" aria-label="Adjustment amount" aria-invalid={!!errors['calc.adjustment'] || undefined} className={`${box} w-[128px] ${errors['calc.adjustment'] ? '!border-[#e5484d]' : ''}`} />
            <Help text="Add a little or take a little off the total (a minus amount takes off)." />
          </div>
          <span className={amountCls} data-calc="adjustment">{signed(totals.adjustment)}</span>
          {errors['calc.adjustment'] && <p role="alert" className="col-span-3 text-[12px] text-[#d9232b] pb-1">{errors['calc.adjustment']}</p>}
        </div>
      )}

      {shown.roundOff !== false && (
        <div className={`${row} min-h-[50px]`}>
          <span>{label('roundOff', 'Round Off')}</span><span />
          <span className={amountCls} data-calc="roundOff">{signed(totals.roundOff)}</span>
        </div>
      )}

      <div className="border-t border-[#ebeaf2] mt-[6px] pt-[14px] pb-[12px]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 min-h-[34px]">
          <span className="text-[16px] font-semibold text-black">Total ( {display.currencySymbol} )</span>
          <span className="text-right pr-[4px] text-[16px] font-semibold text-black" data-calc="total">{money(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}
