import { Noto_Sans } from 'next/font/google';

// The font of the quote document (on the screen, in the print page, on the page a customer opens, and in the PDF): Noto Sans, the sans-serif face of the
// Zoho Books PDF it follows. It is a web font, so the PDF puts it into the picture it draws (see embeddedFonts in pdf.ts).
export const docFont = Noto_Sans({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap' });

export const DOC_FONT_FAMILY = `${docFont.style.fontFamily}, "Noto Sans", Arial, Helvetica, sans-serif`;
