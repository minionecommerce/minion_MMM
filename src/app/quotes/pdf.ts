// "PDF" of a quote: the quote document, exactly as it is shown, becomes the pages of a PDF file that is saved on the person's computer.
// The page is drawn by the browser itself (html-to-image), so layout, fonts, colours, logo and signature are the ones of the preview. Only the
// document is drawn, never the status band, which belongs to the viewer and is not part of the document.

import { WATERMARK } from '@/lib/quotes/watermark';
import { PAGE, pageBreaks, type Interval } from './pdf-breaks';
import { writePdf, type PdfPage } from './pdf-writer';

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('A picture of the quote could not be read.'));
  reader.readAsDataURL(blob);
});

// The company pictures come from the private storage as short-lived links: they are read once and put into the page, so the drawing needs no network
async function inlinePictures(node: HTMLElement) {
  for (const img of Array.from(node.querySelectorAll('img'))) {
    if (img.src.startsWith('data:')) continue;
    const res = await fetch(img.src, { mode: 'cors', credentials: 'omit' }).catch(() => null);
    if (!res || !res.ok) throw new Error('The logo or signature could not be loaded for the PDF. Please try again.');
    img.src = await blobToDataUrl(await res.blob());
    await img.decode().catch(() => undefined);
  }
}

// The web fonts the document uses (Noto Sans). The picture is drawn inside an image, and an image only has the fonts that are written into it:
// every @font-face of a family the document uses is copied with its font file inside, so the PDF has the letters the preview has.
export async function embeddedFonts(node: HTMLElement): Promise<string> {
  const used = new Set<string>();
  for (const el of [node, ...Array.from(node.querySelectorAll('*'))]) {
    for (const name of getComputedStyle(el).fontFamily.split(',')) used.add(name.trim().replace(/^["']|["']$/g, ''));
  }
  const css: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; } // a style sheet of another site cannot be read
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const style = rule.style;
      const family = style.getPropertyValue('font-family').trim().replace(/^["']|["']$/g, '');
      if (!used.has(family)) continue;
      let src = style.getPropertyValue('src');
      const files = Array.from(src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g));
      if (files.length === 0) continue; // a face made of a font the computer has (local), nothing to copy
      try {
        for (const m of files) {
          const res = await fetch(new URL(m[1], sheet.href ?? location.href).href, { credentials: 'omit' });
          if (!res.ok) throw new Error('font file');
          src = src.replace(m[0], `url(${await blobToDataUrl(await res.blob())})`);
        }
      } catch { continue; } // without this face the browser's own sans-serif is used: the PDF is still made
      const range = style.getPropertyValue('unicode-range');
      css.push(`@font-face{font-family:"${family}";src:${src};font-weight:${style.getPropertyValue('font-weight') || '400'};font-style:${style.getPropertyValue('font-style') || 'normal'};${range ? `unicode-range:${range};` : ''}}`);
    }
  }
  return css.join('');
}

// Letters drawn into a picture are a little thinner than the ones a PDF viewer draws from a font file; a thin outline of the text's own colour gives them
// back the weight (a fifth of a pixel, so the text is not made bold)
const TEXT_WEIGHT = '[data-quote-document],[data-quote-document] *{-webkit-text-stroke:0.2px currentColor!important}';

// The zoom of the browser: the screen's scaling (125 %, 150 %) and Ctrl + / -. A browser puts every line and text on whole screen pixels (a 1px
// line is 0.8px at 125 %), so a quote has other heights at another zoom. The picture is drawn at the zoom the person sees, so the pages are cut where
// the preview was measured and the lines and text are those of the preview.
function pageZoom() {
  const zoom = window.devicePixelRatio || 1;
  return zoom !== 1 && typeof CSS !== 'undefined' && CSS.supports('zoom', String(zoom)) ? zoom : 1;
}

// The document drawn by the browser into a canvas: `ratio` canvas pixels for every CSS pixel of the document.
// html-to-image copies the computed style of every element into the picture and makes every font size smaller on the way (10.67px text becomes 9.9px);
// the sizes are put back by a style sheet that is stronger than the copied values.
async function drawDocument(node: HTMLElement, ratio: number, zoom: number): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import('html-to-image');
  const fonts = await embeddedFonts(node);
  const rect = node.getBoundingClientRect();
  const width = node.offsetWidth;
  const marked = [node, ...Array.from(node.querySelectorAll('*'))];
  const sizes = new Set<string>();
  for (const el of marked) {
    const size = getComputedStyle(el).fontSize;
    el.setAttribute('data-pdf-fs', size);
    sizes.add(size);
  }
  try {
    return await toCanvas(node, {
      width: width * zoom,
      height: Math.ceil(rect.height * zoom),
      pixelRatio: ratio / zoom,
      // no background: the document is drawn on a see-through picture and put on a white page, behind the watermark of that page
      skipFonts: true,
      cacheBust: false,
      // not the page's theme variables (--x): what they hold is already in the copied properties, and each one would be copied to every element
      includeStyleProperties: Array.from(getComputedStyle(document.documentElement)).filter(name => !name.startsWith('--')),
      fontEmbedCSS: fonts + TEXT_WEIGHT + Array.from(sizes, s => `[data-pdf-fs="${s}"]{font-size:${s}!important}`).join(''),
      style: { width: `${width}px`, height: `${rect.height}px`, ...(zoom !== 1 ? { zoom: String(zoom) } : {}) },
    });
  } finally {
    for (const el of marked) el.removeAttribute('data-pdf-fs');
  }
}

// Lines of text, table rows, pictures and the totals box: where a page may not be cut
function unsplittable(node: HTMLElement): Interval[] {
  const top = node.getBoundingClientRect().top;
  const out: Interval[] = [];
  const add = (r: DOMRect) => { if (r.height > 0) out.push([r.top - top, r.bottom - top]); };
  const range = document.createRange();
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue?.trim()) continue;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) add(r);
  }
  node.querySelectorAll('img, tbody tr, [data-pdf-keep]').forEach(el => add(el.getBoundingClientRect()));
  return out;
}

export type PdfMeta = { title: string; author?: string };

// The PDF of the quote document in `node` (an element with the document in it, at its natural width)
export async function makeQuotePdf(node: HTMLElement, meta: PdfMeta): Promise<Blob> {
  await document.fonts?.ready;
  await inlinePictures(node);
  await frame();

  const nodeRect = node.getBoundingClientRect();
  const width = node.offsetWidth;
  const height = Math.ceil(nodeRect.height);
  const ratio = Math.max(1.5, Math.min(3, 15000 / height)); // 3x is about 290 dpi; a very long quote is drawn a little smaller
  const zoom = pageZoom();
  const canvas = await drawDocument(node, ratio, zoom);
  const r = canvas.width / width;

  // The box of the document: pages that are cut are closed with its lines, and the empty margin under the box is not a page
  const box = node.querySelector('[data-pdf-box]')?.getBoundingClientRect();
  const boxTop = box ? box.top - nodeRect.top : 0;
  const boxBottom = box ? box.bottom - nodeRect.top : height;
  const boxLeft = box ? box.left - nodeRect.left : 0;
  const boxWidth = box ? box.width : width;
  const logo = node.querySelector<HTMLImageElement>('img[data-company-logo]'); // the same picture, already read into the page by inlinePictures
  const end = Math.min(canvas.height / r, boxBottom + PAGE.bottom);
  const single = end <= PAGE.height + 1; // one page: the margin under the box belongs to it
  // page i shows the document from edges[i] to edges[i + 1]
  const edges = single ? [0, PAGE.height] : [0, ...pageBreaks(end, unsplittable(node)), end];

  const pages: PdfPage[] = [];
  const line = Math.max(1, r / zoom); // a line of the document is one screen pixel thick
  for (let i = 0; i < edges.length - 1; i++) {
    const from = edges[i];
    const to = edges[i + 1];
    const dest = i === 0 ? 0 : PAGE.top;
    const page = document.createElement('canvas');
    page.width = Math.round(PAGE.width * r);
    page.height = Math.round(PAGE.height * r);
    const ctx = page.getContext('2d');
    if (!ctx) throw new Error('This browser cannot draw the PDF.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, page.width, page.height);
    // the logo behind the page, where the Zoho PDF has it, on every page; the document is drawn over it
    if (logo && logo.naturalWidth > 0) {
      const w = WATERMARK.width;
      const h = (w * logo.naturalHeight) / logo.naturalWidth;
      ctx.save();
      ctx.globalAlpha = WATERMARK.opacity;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo, Math.round((WATERMARK.centerX - w / 2) * r), Math.round((WATERMARK.centerY - h / 2) * r), Math.round(w * r), Math.round(h * r));
      ctx.restore();
    }
    const sy = Math.round(from * r);
    const sh = Math.min(canvas.height - sy, Math.round((to - from) * r));
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, Math.round(dest * r), canvas.width, sh);
    ctx.fillStyle = '#9e9e9e';
    const inside = (y: number) => y > boxTop + 1 && y < boxBottom - 1;
    if (i > 0 && inside(from)) ctx.fillRect(Math.round(boxLeft * r), Math.round(dest * r), Math.round(boxWidth * r), line);
    if (i < edges.length - 2 && inside(to)) ctx.fillRect(Math.round(boxLeft * r), Math.round(dest * r) + sh - line, Math.round(boxWidth * r), line);
    const jpeg = await new Promise<Blob>((resolve, reject) => page.toBlob(b => (b ? resolve(b) : reject(new Error('Could not make the page picture.'))), 'image/jpeg', 0.97));
    pages.push({ jpeg: new Uint8Array(await jpeg.arrayBuffer()), width: page.width, height: page.height });
  }
  return new Blob([writePdf(pages, { title: meta.title, author: meta.author }) as BlobPart], { type: 'application/pdf' });
}

// Saves a file on the computer
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
