import { notFound } from 'next/navigation';
import { getSharedQuote } from '@/lib/quotes/share';
import PrintBar from '@/app/quotes/PrintBar';
import QuoteDocument from '@/app/quotes/QuoteDocument';
import { quoteFileBase } from '@/lib/quotes/file-name';

export const dynamic = 'force-dynamic';

// What a customer sees: the quote, read-only, for as long as the link works.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = await getSharedQuote(token);
  if (!doc) notFound();
  return (
    <div className="min-h-screen print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: '@page{size:A4;margin:0}@media print{html,body{background:#fff!important}tr{break-inside:avoid}}' }} />
      <PrintBar backHref={null} autoPrint={false} title={`${doc.title} ${doc.number}`.trim()} fileTitle={quoteFileBase(doc.number)} />
      <div className="py-6 print:py-0 overflow-x-auto"><div className="shadow-[0_2px_12px_rgba(34,38,59,0.12)] print:shadow-none w-[794px] mx-auto"><QuoteDocument doc={doc} watermark /></div></div>
    </div>
  );
}
