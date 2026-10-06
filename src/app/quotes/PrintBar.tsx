'use client';

import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

// The bar above a quote that is shown for printing (it is not printed). "Print / Save as PDF" opens the browser's print window, where
// "Save as PDF" makes the PDF file; the browser names that file after the page title, so the title is the quote number.
export default function PrintBar({ backHref, autoPrint, title, fileTitle }: { backHref: string | null; autoPrint: boolean; title: string; fileTitle?: string }) {
  useEffect(() => {
    if (!fileTitle) return;
    const before = document.title;
    document.title = fileTitle;
    return () => { document.title = before; };
  }, [fileTitle]);
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 600); // the pictures need a moment
    return () => clearTimeout(t);
  }, [autoPrint]);
  return (
    <div className="print:hidden sticky top-0 z-10 h-[52px] px-4 flex items-center gap-3 bg-white border-b border-[#ebeaf2]">
      {backHref && <a href={backHref} className="inline-flex items-center gap-1.5 text-[13px] text-[#575a6f] hover:text-[#22263b]"><ArrowLeft className="w-4 h-4" /> Back</a>}
      <span className="text-[14px] font-medium text-[#22263b] truncate">{title}</span>
      <button type="button" onClick={() => window.print()} className="ml-auto inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[4px] bg-[#548df6] hover:bg-[#4a82ea] text-white text-[13px] font-medium"><Printer className="w-4 h-4" /> Print / Save as PDF</button>
    </div>
  );
}
