// Where a quote is cut into A4 pages for the PDF. Pure maths on numbers (CSS px from the top of the document), so it can be tested alone.

export const PAGE = {
  width: 794, // A4 at 96 dpi: the width of the document
  height: 1123,
  top: 30, // white above the content of the second page and every page after it (the first page has the document's own top margin)
  bottom: 24, // white kept under a page that is followed by another one
} as const;

// A stretch that must not be cut through: a line of text, a table row, a picture, the totals box
export type Interval = readonly [top: number, bottom: number];

// The cut positions of a document that is `end` px tall. Every page but the last holds as much as fits; a cut that would go through an
// interval moves up to the start of it (a line moves whole to the next page). An interval taller than a page is cut where the page ends.
export function pageBreaks(end: number, intervals: readonly Interval[], page = PAGE): number[] {
  const cuts: number[] = [];
  let start = 0;
  for (let guard = 0; guard < 500; guard++) {
    const first = cuts.length === 0;
    if (end - start <= (first ? page.height : page.height - page.top) + 1) break; // what is left fits on this page
    const limit = start + (first ? page.height - page.bottom : page.height - page.top - page.bottom);
    let cut = limit;
    for (let i = 0; i < 100; i++) {
      const hit = intervals.find(([a, b]) => a < cut - 0.5 && cut + 0.5 < b);
      if (!hit) break;
      cut = hit[0];
    }
    if (cut - start < 120) cut = limit; // nothing sensible to move to: cut where the page ends
    cuts.push(cut);
    start = cut;
  }
  return cuts;
}
