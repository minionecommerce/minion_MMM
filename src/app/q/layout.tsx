import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// The page a customer opens with the share link of a quote: no navigator, no sign-in, not for search engines
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = { title: 'Quote', robots: { index: false, follow: false } };

export default function PublicQuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-light-native className={`${inter.variable} min-h-screen bg-[#f3f4f8] text-[#22263b]`} style={{ fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {children}
    </div>
  );
}
