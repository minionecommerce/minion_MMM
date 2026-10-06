// A small PDF writer: one A4 page per JPEG picture, the picture covering the page, and the document's title and author. Pure (bytes in,
// bytes out). A PDF is a list of numbered objects followed by a table of where each one starts, so a viewer can jump to any of them.

export type PdfPage = { jpeg: Uint8Array; width: number; height: number }; // the pixel size of the picture
export type PdfInfo = { title: string; author?: string; creator?: string; created?: Date };

export const A4 = { w: 595.28, h: 841.89 } as const; // points (1/72 inch)

const enc = new TextEncoder();
const hex16 = (s: string) => `<FEFF${Array.from(s, ch => ch.codePointAt(0)!).flatMap(cp => (cp > 0xffff ? [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)] : [cp])).map(u => u.toString(16).padStart(4, "0")).join("")}>`; // a text string as UTF-16BE
const stamp = (d: Date) => `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;

export function writePdf(pages: PdfPage[], info: PdfInfo): Uint8Array {
  if (!pages.length) throw new Error("A PDF needs at least one page.");
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const put = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, dict: string, stream?: Uint8Array) => {
    offsets[n] = length;
    if (stream) {
      put(`${n} 0 obj\n<< ${dict} /Length ${stream.length} >>\nstream\n`);
      put(stream);
      put("\nendstream\nendobj\n");
    } else {
      put(`${n} 0 obj\n${dict}\nendobj\n`);
    }
  };

  put(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %PDF-1.4 and a comment of high bytes (marks the file as binary)

  // 1 catalog, 2 page tree, 3 info; then for each page: the page, its content and its picture
  const first = 4;
  const pageObj = (i: number) => first + i * 3;
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  object(3, `<< /Title ${hex16(info.title)} /Producer ${hex16("Minion CRM")} /Creator ${hex16(info.creator ?? "Minion CRM")}${info.author ? ` /Author ${hex16(info.author)}` : ""} /CreationDate (${stamp(info.created ?? new Date())}) >>`);
  pages.forEach((p, i) => {
    const page = pageObj(i);
    object(page, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im0 ${page + 2} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${page + 1} 0 R >>`);
    object(page + 1, "", enc.encode(`q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im0 Do Q`));
    object(page + 2, `/Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, p.jpeg);
  });

  const count = first + pages.length * 3; // objects 1 .. count-1, plus the free entry 0
  const xref = length;
  put(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let n = 1; n < count; n++) put(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  put(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}
