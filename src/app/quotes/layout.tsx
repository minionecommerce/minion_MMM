import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = { title: 'Quotes | Minion' };

// The Quotes screens follow the Zoho Books reference: Inter, light, lavender lines
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const CSS = `
.q-check{appearance:none;-webkit-appearance:none;width:15px;height:15px;border:1px solid #bfbfbf;border-radius:3px;background:#fff;display:inline-block;vertical-align:middle;cursor:pointer;position:relative;margin:0;flex-shrink:0}
.q-check:checked,.q-check:indeterminate{background:#548df6;border-color:#548df6}
.q-check:checked::after{content:'';position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.q-check:indeterminate::after{content:'';position:absolute;left:3px;top:6px;width:7px;height:2px;background:#fff}
.q-check:focus-visible{outline:2px solid #548df6;outline-offset:1px}
.q-check-lg{width:17px;height:17px}
.q-check-lg:checked::after{left:5px;top:1px;width:4px;height:9px}
.q-check:disabled{opacity:.5;cursor:not-allowed}
.q-radio{appearance:none;-webkit-appearance:none;width:13px;height:13px;border:1px solid #9ca0ab;border-radius:50%;background:#fff;display:inline-block;vertical-align:middle;cursor:pointer;position:relative;margin:0;flex-shrink:0}
.q-radio:checked{border-color:#548df6;border-width:4px}
.q-radio:focus-visible{outline:2px solid #548df6;outline-offset:1px}
.q-scroll::-webkit-scrollbar{width:8px;height:8px}
.q-scroll::-webkit-scrollbar-thumb{background:#c9cbd6;border-radius:4px}
`;

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-light-native className={`${inter.variable} min-h-screen bg-white text-[#22263b]`} style={{ fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {children}
    </div>
  );
}
