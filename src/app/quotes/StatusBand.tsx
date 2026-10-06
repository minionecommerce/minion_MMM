// The Draft / Sent / Accepted / Declined band in the top-left corner of the quote in the CRM viewer. It is only a sign for the people who work
// in the CRM, not a part of the quote: it is drawn over the page by the viewer (never inside the document), is hidden when printing, and the
// PDF is made from the document alone, so it never reaches a customer. Place it in an element that is `relative` and as wide as the page.
// Measured on the reference: a band 25.5px thick whose centre line runs where x + y = 63 from the corner of the page, cut by a 96px square.
const COLOR: Record<string, string> = { Draft: '#96a5a6', Sent: '#418dd9', Accepted: '#2fa070', Declined: '#e5484d', Invoiced: '#2fa070' };

export default function StatusBand({ status }: { status: string }) {
  return (
    <div data-status-band className="print:hidden absolute overflow-hidden pointer-events-none" style={{ top: -3, left: -3, width: 96, height: 96 }} role="img" aria-label={`Status: ${status}`}>
      <span
        className="absolute block text-center text-white"
        style={{ background: COLOR[status] ?? COLOR.Draft, width: 150, height: 25.5, lineHeight: '25.5px', left: -40.5, top: 21.75, transform: 'rotate(-45deg)', fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 12, fontWeight: 500 }}
      >
        {status}
      </span>
    </div>
  );
}
