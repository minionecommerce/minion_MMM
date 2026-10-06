// The file name of a quote's PDF: the quote number exactly as it reads, so QT/MSHS/26-27/A/725 gives QT/MSHS/26-27/A/725.pdf.
// A file name cannot hold "/" (nor \ : * ? " < > |) on any system, so each of those is written as the look-alike character that a file
// name can hold (the division slash for "/"). Everything else in the number is kept, so the name reads like the number and follows it
// when the number format is changed.
const LOOKALIKE: Record<string, string> = {
  "/": "∕", // ∕
  "\\": "＼", // ＼
  ":": "：", // ：
  "*": "＊", // ＊
  "?": "？", // ？
  '"': "＂", // ＂
  "<": "＜", // ＜
  ">": "＞", // ＞
  "|": "｜", // ｜
};

export function quoteFileBase(quoteNumber: string): string {
  const base = quoteNumber
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, c => LOOKALIKE[c])
    .trim()
    .replace(/[. ]+$/, "") // Windows drops trailing dots and spaces
    .slice(0, 120);
  return base || "Quote";
}

export const quotePdfName = (quoteNumber: string) => `${quoteFileBase(quoteNumber)}.pdf`;
