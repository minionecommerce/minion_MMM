import { notFound } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { documentOf } from '@/lib/quotes/doc-server';
import { quoteFileBase } from '@/lib/quotes/file-name';
import { getQuote } from '@/lib/quotes/service';
import { ServiceError } from '@/lib/users/service';
import PrintBar from '../../PrintBar';
import QuoteDocument from '../../QuoteDocument';

export const dynamic = 'force-dynamic';

// The quote as a page for printing / saving as a PDF: just the document, on an A4 sheet.
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(['quotes']);
  const { id } = await params;
  const sp = await searchParams;
  let found: Awaited<ReturnType<typeof getQuote>>;
  try {
    found = await getQuote(ctx, id);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) notFound();
    throw err;
  }
  const doc = await documentOf(found.quote, found.layout, found.settings);
  return (
    <div className="min-h-screen bg-[#f3f4f8] print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: '@page{size:A4;margin:0}@media print{html,body{background:#fff!important}[data-sidebar]{display:none!important}tr{break-inside:avoid}}' }} />
      <PrintBar backHref={`/quotes/${id}`} autoPrint={sp.print === '1'} title={`${found.quote.quoteNumber}`} fileTitle={quoteFileBase(found.quote.quoteNumber)} />
      <div className="py-6 print:py-0"><div className="shadow-[0_2px_12px_rgba(34,38,59,0.12)] print:shadow-none w-[794px] mx-auto"><QuoteDocument doc={doc} /></div></div>
    </div>
  );
}
